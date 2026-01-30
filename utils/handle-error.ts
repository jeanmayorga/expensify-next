// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function getErrorMessage(error: any) {
  return (
    error.response?.data?.error?.message ||
    error.response?.data?.error ||
    error.message ||
    "Unknown error"
  );
}
