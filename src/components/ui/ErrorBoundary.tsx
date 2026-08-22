"use client"
import { Component, type ReactNode, type ErrorInfo } from "react"
import { Button } from "./button"

interface Props { children: ReactNode }
interface State { hasError: boolean; error: Error | null }

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("ErrorBoundary:", error, info.componentStack)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex items-center justify-center min-h-[200px]">
          <div className="bg-red-50 border border-red-200 rounded-xl p-6 max-w-md text-center">
            <p className="text-red-600 font-semibold mb-2">Algo deu errado</p>
            <p className="text-sm text-red-500 mb-4">{this.state.error?.message}</p>
            <Button onClick={() => this.setState({ hasError: false, error: null })}>
              Tentar novamente
            </Button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}
