import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'danger';
  isLoading?: boolean;
}

export const Button: React.FC<ButtonProps> = ({ 
  children, 
  variant = 'primary', 
  isLoading = false, 
  className = '', 
  disabled,
  ...props 
}) => {
  const baseStyles = "px-6 py-3 rounded-xl font-medium transition-all duration-200 flex items-center justify-center gap-2 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[#0c0a09] uppercase tracking-wider text-sm";
  
  const variants = {
    primary: "bg-[#ea580c] hover:bg-[#c2410c] text-white shadow-lg shadow-orange-900/40 focus:ring-orange-500 border border-transparent",
    secondary: "bg-[#44403c] hover:bg-[#57534e] text-stone-100 shadow-md focus:ring-stone-500 border border-transparent",
    outline: "bg-transparent border-2 border-[#57534e] text-[#a8a29e] hover:border-[#ea580c] hover:text-[#ea580c] focus:ring-[#ea580c]",
    danger: "bg-red-900/50 hover:bg-red-800/50 text-red-200 border border-red-800"
  };

  return (
    <button 
      className={`${baseStyles} ${variants[variant]} ${isLoading || disabled ? 'opacity-50 cursor-not-allowed' : ''} ${className}`}
      disabled={isLoading || disabled}
      {...props}
    >
      {isLoading ? (
        <>
          <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          PROCESSING...
        </>
      ) : children}
    </button>
  );
};