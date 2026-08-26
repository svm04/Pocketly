import React, { useState } from 'react'
import { FaRegEye, FaEyeSlash } from 'react-icons/fa6'

const Input = ({ value, onChange, placeholder, label, type, disabled }) => {
    const [showPassword, setShowPassword] = useState(false);

    const toggleShowPassword = () => {
        setShowPassword(!showPassword);
    };

    return (
        <div>
            <label className="text-[13px] text-slate-800 dark:text-gray-300">{label}</label>
            <div className={`input-box ${disabled ? "bg-slate-50 dark:bg-gray-800 text-slate-400 dark:text-gray-500" : ""}`}>
                <input
                    type={type === "password" ? (showPassword ? "text" : "password") : type}
                    placeholder={placeholder}
                    className="w-full bg-transparent outline-none disabled:cursor-not-allowed"
                    value={value}
                    onChange={onChange}
                    disabled={disabled}
                />

                {type === "password" && (
                    <>
                        {showPassword ? (
                            <FaRegEye
                                size={22}
                                className="text-primary cursor-pointer"
                                onClick={toggleShowPassword}
                            />
                        ) : (
                            <FaEyeSlash
                                size={22}
                                className="text-slate-400 dark:text-gray-500 cursor-pointer"
                                onClick={toggleShowPassword}
                            />
                        )}
                    </>
                )}
            </div>
        </div>
    )
}

export default Input;
