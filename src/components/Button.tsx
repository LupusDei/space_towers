// Button Component - Styled game buttons with glowing border effect

import '../styles/Button.css';

export type ButtonVariant = 'primary' | 'danger' | 'success' | 'gold';
export type ButtonSize = 'small' | 'medium' | 'large';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  children: React.ReactNode;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary: '',
  danger: 'game-button--danger',
  success: 'game-button--success',
  gold: 'game-button--gold',
};

const sizeClasses: Record<ButtonSize, string> = {
  small: 'game-button--small',
  medium: '',
  large: 'game-button--large',
};

export default function Button({
  variant = 'primary',
  size = 'medium',
  className = '',
  children,
  ...props
}: ButtonProps) {
  const classes = ['game-button', variantClasses[variant], sizeClasses[size], className]
    .filter(Boolean)
    .join(' ');

  return (
    <button className={classes} {...props}>
      {children}
    </button>
  );
}
