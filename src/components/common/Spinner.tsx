export default function Spinner({ className = '' }: { className?: string }) {
  return (
    <div
      className={`animate-spin rounded-full border-2 border-brand border-t-transparent w-5 h-5 ${className}`}
    />
  );
}
