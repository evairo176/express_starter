import bcrypt from 'bcryptjs';

export const hashValue = async (value: string, salt: number = 10) => {
  const hashPassword = await bcrypt.hash(value, salt);
  return hashPassword;
};

export const compareValue = async (value: string, hashedValue: string) => {
  const compare = await bcrypt.compare(value, hashedValue);
  return compare;
};
