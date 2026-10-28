import * as React from "react"

const Dialog = ({ open, onOpenChange, children, maxWidthClass = "max-w-2xl" }) => {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="fixed inset-0 bg-black/50"
        onClick={() => onOpenChange(false)}
      />
      <div className={`relative bg-white rounded-lg shadow-lg ${maxWidthClass} w-full mx-4 max-h-[90vh] overflow-y-auto`}>
        {children}
      </div>
    </div>
  )
}

const DialogContent = React.forwardRef(({ children, ...props }, ref) => (
  <div ref={ref} {...props}>
    {children}
  </div>
))
DialogContent.displayName = "DialogContent"

const DialogHeader = ({ children, ...props }) => (
  <div className="px-6 py-4 border-b" {...props}>
    {children}
  </div>
)

const DialogTitle = ({ children, ...props }) => (
  <h2 className="text-xl font-semibold text-gray-900" {...props}>
    {children}
  </h2>
)

const DialogDescription = ({ children, ...props }) => (
  <p className="text-sm text-gray-500 mt-1" {...props}>
    {children}
  </p>
)

export { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription }
