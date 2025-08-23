import React from "react";
type State = { hasError: boolean; message?: string };
export class ErrorBoundary extends React.Component<React.PropsWithChildren, State> {
  state: State = { hasError: false };
  static getDerivedStateFromError(error: any) { return { hasError: true, message: String(error) }; }
  componentDidCatch(error: any, info: any) { console.error(error, info); }
  render() {
    if (this.state.hasError) {
      return <div className="p-6 bg-red-50 border border-red-200 rounded-xl text-red-700">حدث خطأ غير متوقع: {this.state.message}</div>;
    }
    return this.props.children;
  }
}
