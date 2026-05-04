import logoImg from '../../assets/logo.png';

export default function Logo({ size = "md", className = "" }) {
  const sizes = {
    sm: "h-8",
    md: "h-10",
    lg: "h-12",
    xl: "h-16"
  };

  return (
    <img 
      src={logoImg} 
      alt="CampusFlow Logo" 
      className={`${sizes[size] || sizes.md} object-contain ${className}`} 
    />
  );
}
