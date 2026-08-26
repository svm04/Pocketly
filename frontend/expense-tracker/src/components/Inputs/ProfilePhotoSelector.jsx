import React, { useRef, useState } from 'react'
import {LuUser, LuUpload,LuTrash} from 'react-icons/lu';


const ProfilePhotoSelector = ({ image, setImage, initialImageUrl }) => {
    const inputRef = useRef(null);
    const [previewURL, setPreviewURL] = useState(null);

    const handleImageChange = (event) => {
        const file = event.target.files[0];
        if (file) {
            //Update the image state in parent component
            setImage(file);
            //Create a preview URL
            const preview = URL.createObjectURL(file);
            setPreviewURL(preview);
        }
    };
    const handleRemoveImage = () => {
        setImage(null);
        setPreviewURL(null);
    };

    const onChooseFile = () => {
        inputRef.current.click();
    };

    // Prefer a freshly-picked file's preview; otherwise fall back to an
    // existing remote image (e.g. the user's current avatar when editing
    // their profile).
    const displayUrl = previewURL || (image ? null : initialImageUrl);

    return (
        <div className="flex justify-center mb-6">
            <input
                type="file"
                accept="image/*"
                ref={inputRef}
                onChange={handleImageChange}
                className="hidden"
            />
            {!displayUrl ? (
                <div className="w-20 h-20 flex items-center justify-center bg-purple-100 dark:bg-purple-500/10 rounded-full relative">
                    <LuUser className="dark:text-gray-300"/>

                    <button
                    type="button"
                    className="w-8 h-8 flex items-center justify-center bg-primary text-white rounded-full absolute bottom-1 right-1"
                    onClick={onChooseFile}
                >
                    <LuUpload />
                    </button>
                </div>
            ) : (
                <div className="relative">
                    <img
                        src={displayUrl}
                        alt="Profile Preview"
                        className="w-20 h-20 rounded-full object-cover"
                    />
                    <button
                        type="button"
                        className="w-8 h-8 flex items-center justify-center bg-primary text-white rounded-full absolute bottom-1 right-1"
                        onClick={onChooseFile}
                    >
                        <LuUpload size={14} />
                    </button>
                    {image && (
                        <button
                            type="button"
                            className="w-8 h-8 flex items-center justify-center bg-red-500 text-white rounded-full absolute bottom-1 left-0"
                            onClick={handleRemoveImage}
                        >
                            <LuTrash size={16} />
                        </button>
                    )}
                </div>
            )}
        </div>
    )
}

export default ProfilePhotoSelector
