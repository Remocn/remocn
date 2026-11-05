/** OpenPanel logo mark, drawn in `currentColor`. */
export function OpenPanelMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 61 35"
      xmlns="http://www.w3.org/2000/svg"
      fill="currentColor"
      aria-hidden="true"
      className={className}
    >
      <rect x="34.03" y="0.37" width="10.35" height="34.23" rx="5.17" />
      <rect x="49.95" y="0.37" width="10.35" height="17.51" rx="5.17" />
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M14.212 0C6.363 0 0 6.363 0 14.212V20.02C0 27.869 6.363 34.232 14.212 34.232C22.061 34.232 28.424 27.869 28.424 20.02V14.212C28.424 6.363 22.061 0 14.212 0ZM14.238 8.36C11.381 8.36 9.064 10.676 9.064 13.534V20.697C9.064 23.555 11.381 25.871 14.238 25.871C17.095 25.871 19.412 23.555 19.412 20.697V13.534C19.412 10.676 17.095 8.36 14.238 8.36Z"
      />
    </svg>
  );
}
