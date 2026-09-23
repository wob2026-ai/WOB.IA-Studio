
export const cleanCPF = (value: string): string => {
  return value.replace(/\D/g, '');
};

export const validateCPF = (cpf: string): boolean => {
  const clean = cleanCPF(cpf);
  // Apenas verifica se tem 11 dígitos, sem validar os dígitos verificadores
  return clean.length === 11;
};

export const formatCPF = (value: string): string => {
  const clean = cleanCPF(value);
  if (clean.length <= 3) return clean;
  if (clean.length <= 6) return `${clean.slice(0, 3)}.${clean.slice(3)}`;
  if (clean.length <= 9) return `${clean.slice(0, 3)}.${clean.slice(3, 6)}.${clean.slice(6)}`;
  return `${clean.slice(0, 3)}.${clean.slice(3, 6)}.${clean.slice(6, 9)}-${clean.slice(9, 11)}`;
};
