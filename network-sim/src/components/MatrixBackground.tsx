import type React from 'react'

const MATRIX_CHARS = '01';

const createColumnText = (length: number) => {
  let result = '';
  for (let i = 0; i < length; i += 1) {
    const index = Math.floor(Math.random() * MATRIX_CHARS.length);
    result += MATRIX_CHARS[index] + '\n';
  }
  return result;
};

const columns = Array.from({ length: 20 }, () => createColumnText(40));

export const MatrixBackground: React.FC = () => {
  return (
    <div className="matrix-bg" aria-hidden="true">
      {columns.map((text, idx) => (
        <pre
          key={idx}
          className="matrix-column"
          style={{ animationDelay: `${(idx * 0.7) % 10}s` }}
        >
          {text}
        </pre>
      ))}
    </div>
  );
};
