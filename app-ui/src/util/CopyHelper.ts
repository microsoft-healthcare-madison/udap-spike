
export class CopyHelper {
   
  /** Function to perform copying generic text to the clipboard */
  static copyToClipboard(message: string) {
    // copy, ignore errors
    try {
      navigator.clipboard.writeText(message);
    } catch (err) {
      // failed
      return false;
    }
    return true;
  }
}