/**
 * Typed toast helpers wrapping sonner. Prefer these over raw toast.* for consistent types.
 * Direct `import { toast } from "sonner"` still works everywhere.
 *
 * @example
 * import { notify } from "@/lib/notify"
 * notify.success("Saved", { description: "Changes applied." })
 * notify.error("Failed", { description: err.message })
 */
import { toast } from "sonner"

export const notify = {
  success(title, options) {
    return toast.success(title, { duration: 4000, ...options })
  },
  error(title, options) {
    return toast.error(title, { duration: 6000, ...options })
  },
  warning(title, options) {
    return toast.warning(title, { duration: 4000, ...options })
  },
  info(title, options) {
    return toast.info(title, { duration: 4000, ...options })
  },
  loading(title, options) {
    return toast.loading(title, { ...options })
  },
  promise(promise, messages) {
    return toast.promise(promise, messages)
  },
  dismiss(id) {
    return toast.dismiss(id)
  },
}

export default notify
