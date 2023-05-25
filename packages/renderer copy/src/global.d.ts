
export { }

declare global {
  interface Window {
    removeLoading: () => void
    
  }
}

declare $electron: any