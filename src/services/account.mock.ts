// Mock account-deletion — clears no real data (mock state is in-process only).
// Just resolves so the UI flow (confirmation → loading → welcome) can be tested
// without a real backend.

export async function deleteAccount(): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, 600));
  // Nothing to delete in mock mode — in-process state resets on app reload.
}
