export const MIN_PASSWORD_LENGTH = 12;

export type PasswordRequirement = {
  id: string;
  label: string;
  met: boolean;
};

export function getSignUpPasswordRequirements(password: string): PasswordRequirement[] {
  return [
    {
      id: 'length',
      label: `At least ${String(MIN_PASSWORD_LENGTH)} characters`,
      met: password.length >= MIN_PASSWORD_LENGTH,
    },
    {
      id: 'lower',
      label: 'One lowercase letter',
      met: /[a-z]/.test(password),
    },
    {
      id: 'upper',
      label: 'One uppercase letter',
      met: /[A-Z]/.test(password),
    },
    {
      id: 'digit',
      label: 'One number',
      met: /\d/.test(password),
    },
  ];
}

export function signUpPasswordIssues(password: string): string[] {
  return getSignUpPasswordRequirements(password)
    .filter((requirement) => !requirement.met)
    .map((requirement) => requirement.label);
}
