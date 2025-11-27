import { Text, TouchableOpacity, TouchableOpacityProps, ActivityIndicator } from "react-native";

interface ButtonProps extends TouchableOpacityProps {
    title: string;
    variant?: "primary" | "secondary" | "outline";
    loading?: boolean;
}

export function Button({ title, variant = "primary", loading, className, ...props }: ButtonProps) {
    const baseStyles = "h-14 rounded-2xl flex-row items-center justify-center px-6 active:opacity-80";

    const variants = {
        primary: "bg-indigo-600 shadow-lg shadow-indigo-500/30",
        secondary: "bg-gray-800",
        outline: "border-2 border-gray-700 bg-transparent",
    };

    const textVariants = {
        primary: "text-white font-bold text-lg text-center",
        secondary: "text-white font-semibold text-lg text-center",
        outline: "text-gray-300 font-semibold text-base text-center",
    };

    return (
        <TouchableOpacity
            className={`${baseStyles} ${variants[variant]} ${className}`}
            disabled={loading}
            {...props}
        >
            {loading ? (
                <ActivityIndicator color="white" />
            ) : (
                <Text className={textVariants[variant]}>{title}</Text>
            )}
        </TouchableOpacity>
    );
}
