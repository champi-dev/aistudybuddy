import React from 'react'
import { AlertTriangle, RefreshCw, Home } from 'lucide-react'
import Button from './ui/Button'

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null, errorInfo: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true }
  }

  componentDidCatch(error, errorInfo) {
    this.setState({
      error: error,
      errorInfo: errorInfo
    })
    
    // Log error to console in development
    if (import.meta.env.DEV) {
      console.error('ErrorBoundary caught an error:', error, errorInfo)
    }
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null, errorInfo: null })
  }

  handleGoHome = () => {
    window.location.href = '/'
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-surface rounded-xl p-8 border border-surface-light text-center">
            <div className="flex justify-center mb-6">
              <div className="w-16 h-16 bg-error/10 rounded-full flex items-center justify-center">
                <AlertTriangle className="w-8 h-8 text-error" />
              </div>
            </div>
            
            <h1 className="text-xl font-bold text-text-primary mb-2">
              Something went wrong
            </h1>
            
            <p className="text-text-secondary mb-6">
              We're sorry, but something unexpected happened. Please try refreshing the page or go back to the home page.
            </p>

            {import.meta.env.DEV && this.state.error && (
              <details className="mb-6 text-left">
                <summary className="text-sm text-text-secondary cursor-pointer hover:text-text-primary">
                  Error Details (Development)
                </summary>
                <div className="mt-2 p-3 bg-surface-light rounded text-xs font-mono text-text-secondary overflow-auto max-h-32">
                  <div className="text-error font-bold mb-1">
                    {this.state.error.toString()}
                  </div>
                  <div className="whitespace-pre-wrap">
                    {this.state.errorInfo.componentStack}
                  </div>
                </div>
              </details>
            )}

            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={this.handleRetry}
                className="flex-1"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Try Again
              </Button>
              
              <Button
                onClick={this.handleGoHome}
                className="flex-1"
              >
                <Home className="w-4 h-4 mr-2" />
                Go Home
              </Button>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary