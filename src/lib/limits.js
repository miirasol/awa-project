// LENGTH LIMITS THANK YOU VERY MUCH
export const LIMITS = {
  personName: 60,
  clinicName: 60,
  serviceName: 60,
  address: 120,
  email: 254,
  phone: 20,
  reason: 500,
};

export function tooLong(value, max) {
  return String(value ?? "").trim().length > max;
}
