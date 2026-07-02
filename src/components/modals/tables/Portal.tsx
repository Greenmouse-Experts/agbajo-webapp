import { createPortal } from "react-dom";

export default function Portal({ children }: any) {
  return createPortal(children, document.body);
}
