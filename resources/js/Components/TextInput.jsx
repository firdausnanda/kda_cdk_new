import { forwardRef, useEffect, useRef } from 'react';

export default forwardRef(function TextInput({ type = 'text', className = '', isFocused = false, ...props }, ref) {
    const input = ref ? ref : useRef();

    useEffect(() => {
        if (isFocused) {
            input.current.focus();
        }
    }, []);

    return (
        <input
            {...props}
            type={type}
            className={
                'border-gray-200 bg-gray-50 text-gray-900 focus:bg-white focus:border-primary-600 focus:ring-primary-600 rounded-xl shadow-sm transition-all duration-200 disabled:bg-gray-100/50 disabled:text-gray-400 disabled:border-gray-100 disabled:cursor-not-allowed ' +
                className
            }
            ref={input}
        />
    );
});
