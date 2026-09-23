import { 
  signInWithPopup, 
  GoogleAuthProvider, 
  onAuthStateChanged, 
  User 
} from 'firebase/auth';
import { auth } from '../firebase';
import { QuizQuestion } from '../types';

export const FORMS_SCOPES = [
  'https://www.googleapis.com/auth/drive',
  'https://www.googleapis.com/auth/drive.file',
  'https://www.googleapis.com/auth/drive.readonly',
  'https://www.googleapis.com/auth/forms.body',
  'https://www.googleapis.com/auth/forms.body.readonly',
  'https://www.googleapis.com/auth/forms.responses.readonly'
];

const provider = new GoogleAuthProvider();
FORMS_SCOPES.forEach(scope => provider.addScope(scope));

// In-memory cache for access token (MANDATORY: never stored in localStorage)
let cachedAccessToken: string | null = null;
let isSigningIn = false;

export const initFormsAuth = (
  onAuthSuccess?: (user: User, token: string) => void,
  onAuthFailure?: () => void
) => {
  return onAuthStateChanged(auth, async (user: User | null) => {
    if (user) {
      if (cachedAccessToken) {
        if (onAuthSuccess) onAuthSuccess(user, cachedAccessToken);
      } else if (!isSigningIn) {
        // User logged in via Firebase session but token needs refresh or prompt
        if (onAuthFailure) onAuthFailure();
      }
    } else {
      cachedAccessToken = null;
      if (onAuthFailure) onAuthFailure();
    }
  });
};

export const signInWithGoogleForms = async (): Promise<{ user: User; accessToken: string }> => {
  try {
    isSigningIn = true;
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential?.accessToken) {
      throw new Error('Falha ao obter token de acesso da conta Google.');
    }

    cachedAccessToken = credential.accessToken;
    return { user: result.user, accessToken: cachedAccessToken };
  } catch (error: any) {
    console.error('Google Sign In error:', error);
    throw error;
  } finally {
    isSigningIn = false;
  }
};

export const getFormsAccessToken = (): string | null => {
  return cachedAccessToken;
};

export const setFormsAccessToken = (token: string | null) => {
  cachedAccessToken = token;
};

export const logoutGoogleForms = async () => {
  try {
    await auth.signOut();
  } finally {
    cachedAccessToken = null;
  }
};

export interface GoogleDriveFormFile {
  id: string;
  name: string;
  webViewLink?: string;
  createdTime?: string;
  modifiedTime?: string;
  iconLink?: string;
}

export interface GoogleFormDetails {
  formId: string;
  info: {
    title: string;
    description?: string;
    documentTitle?: string;
  };
  responderUri?: string;
  items?: Array<{
    itemId: string;
    title: string;
    description?: string;
    questionItem?: {
      question: {
        questionId: string;
        required?: boolean;
        choiceQuestion?: {
          type: string;
          options: Array<{ value: string }>;
        };
      };
    };
  }>;
}

/**
 * List all Google Forms created by the user from Google Drive
 */
export async function listUserGoogleForms(token?: string): Promise<GoogleDriveFormFile[]> {
  const activeToken = token || cachedAccessToken;
  if (!activeToken) {
    throw new Error('Autenticação Google necessária para listar formulários.');
  }

  const query = encodeURIComponent("mimeType = 'application/vnd.google-apps.form' and trashed = false");
  const url = `https://www.googleapis.com/drive/v3/files?q=${query}&fields=files(id,name,webViewLink,createdTime,modifiedTime,iconLink)&orderBy=modifiedTime desc&pageSize=30`;

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${activeToken}`,
      'Accept': 'application/json'
    }
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Erro ao listar formulários do Google Drive: ${response.statusText} (${errorText})`);
  }

  const data = await response.json();
  return data.files || [];
}

/**
 * Fetch a single Google Form by ID
 */
export async function getGoogleForm(formId: string, token?: string): Promise<GoogleFormDetails> {
  const activeToken = token || cachedAccessToken;
  if (!activeToken) {
    throw new Error('Autenticação Google necessária.');
  }

  const response = await fetch(`https://forms.googleapis.com/v1/forms/${formId}`, {
    headers: {
      Authorization: `Bearer ${activeToken}`,
      'Accept': 'application/json'
    }
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Erro ao buscar detalhes do Google Form: ${errorText}`);
  }

  return response.json();
}

/**
 * Fetch responses for a Google Form
 */
export async function getGoogleFormResponses(formId: string, token?: string): Promise<any> {
  const activeToken = token || cachedAccessToken;
  if (!activeToken) {
    throw new Error('Autenticação Google necessária.');
  }

  const response = await fetch(`https://forms.googleapis.com/v1/forms/${formId}/responses`, {
    headers: {
      Authorization: `Bearer ${activeToken}`,
      'Accept': 'application/json'
    }
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Erro ao buscar respostas do Google Form: ${errorText}`);
  }

  return response.json();
}

/**
 * Creates a complete Google Form with Questions from Explica+ Quizzes
 */
export async function exportQuizzesToGoogleForm(
  title: string,
  description: string,
  quizzes: QuizQuestion[],
  token?: string
): Promise<{ formId: string; editUrl: string; responderUri: string }> {
  const activeToken = token || cachedAccessToken;
  if (!activeToken) {
    throw new Error('Autenticação Google necessária para criar o formulário.');
  }

  // 1. Create the base form
  const createRes = await fetch('https://forms.googleapis.com/v1/forms', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${activeToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      info: {
        title: title || 'Quiz de Conhecimento Claro - Explica+',
        documentTitle: title || 'Quiz de Conhecimento Claro - Explica+'
      }
    })
  });

  if (!createRes.ok) {
    const errText = await createRes.text();
    throw new Error(`Falha ao criar o Google Form: ${errText}`);
  }

  const createdForm = await createRes.json();
  const formId = createdForm.formId;

  // 2. Prepare batch update requests to add questions and description
  const requests: any[] = [
    {
      updateFormInfo: {
        info: {
          description: description || 'Treinamento e Avaliação de Conhecimento Técnico e Comercial Claro.'
        },
        updateMask: 'description'
      }
    }
  ];

  quizzes.forEach((quiz, index) => {
    const options = quiz.options.map(opt => ({ value: opt }));
    
    requests.push({
      createItem: {
        item: {
          title: `${index + 1}. ${quiz.question}`,
          description: quiz.explanation ? `💡 Dica / Justificativa Pedagógica: ${quiz.explanation}` : undefined,
          questionItem: {
            question: {
              required: true,
              choiceQuestion: {
                type: 'RADIO',
                options: options,
                shuffle: false
              }
            }
          }
        },
        location: {
          index: index
        }
      }
    });
  });

  // 3. Send batchUpdate
  if (requests.length > 0) {
    const updateRes = await fetch(`https://forms.googleapis.com/v1/forms/${formId}:batchUpdate`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${activeToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ requests })
    });

    if (!updateRes.ok) {
      const errText = await updateRes.text();
      console.warn('Google Form batch update warning:', errText);
    }
  }

  // 4. Get final responder URI
  const finalForm = await getGoogleForm(formId, activeToken);

  return {
    formId,
    editUrl: `https://docs.google.com/forms/d/${formId}/edit`,
    responderUri: finalForm.responderUri || `https://docs.google.com/forms/d/e/${formId}/viewform`
  };
}
