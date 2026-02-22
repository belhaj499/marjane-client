const Toast = ({ toast }) => {
  if (!toast) return null;
  return (
    <div className="toast toast-show">
      {toast.message}
    </div>
  );
};

export default Toast;
