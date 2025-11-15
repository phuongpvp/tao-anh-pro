
import React, { useState, useCallback, useEffect, useRef } from 'react';
import { AspectRatio } from './types';
import { fileToBase64, cropImage } from './utils/imageUtils';
import { generateBrandedImage } from './services/geminiService';
import { UploadIcon, SparklesIcon, DownloadIcon, ResetIcon } from './components/icons';

const App: React.FC = () => {
    const [originalImage, setOriginalImage] = useState<string | null>(null);
    const [croppedImage, setCroppedImage] = useState<string | null>(null);
    const [prompt, setPrompt] = useState<string>('');
    const [aspectRatio, setAspectRatio] = useState<AspectRatio>(AspectRatio.Square);
    const [generatedImage, setGeneratedImage] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [isCropping, setIsCropping] = useState<boolean>(false);
    const [isPreviewOpen, setIsPreviewOpen] = useState<boolean>(false);

    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (originalImage) {
            setIsCropping(true);
            setError(null);
            cropImage(originalImage, aspectRatio)
                .then(setCroppedImage)
                .catch(err => {
                    console.error("Failed to crop image:", err);
                    setError("Không thể cắt ảnh. Vui lòng thử một ảnh khác.");
                })
                .finally(() => setIsCropping(false));
        }
    }, [originalImage, aspectRatio]);

    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                setIsPreviewOpen(false);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, []);
    
    const handleFileChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            handleReset(); // Reset everything for a new image
            fileToBase64(file)
                .then(setOriginalImage)
                .catch(err => {
                    console.error(err);
                    setError("Không thể tải tệp lên. Vui lòng thử lại.");
                });
        }
    }, []);

    const handleGenerateClick = useCallback(async () => {
        if (!croppedImage || !prompt.trim()) {
            setError("Vui lòng tải ảnh lên và nhập mô tả.");
            return;
        }
        setIsLoading(true);
        setError(null);
        setGeneratedImage(null);

        try {
            const result = await generateBrandedImage(croppedImage, prompt);
            setGeneratedImage(result);
        } catch (e: any) {
            setError(e.message || "Đã xảy ra lỗi không mong muốn.");
        } finally {
            setIsLoading(false);
        }
    }, [croppedImage, prompt]);

    const handleReset = useCallback(() => {
        setOriginalImage(null);
        setCroppedImage(null);
        setPrompt('');
        setGeneratedImage(null);
        setIsLoading(false);
        setError(null);
        setAspectRatio(AspectRatio.Square);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    }, []);

    const downloadImage = () => {
        if (!generatedImage) return;
        const link = document.createElement('a');
        link.href = generatedImage;
        link.download = `branded-image-${Date.now()}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };
    
    const openPreview = () => {
        if (generatedImage) {
            setIsPreviewOpen(true);
        }
    }

    const aspectRatioOptions = [
        { label: 'Vuông', value: AspectRatio.Square },
        { label: 'Ngang', value: AspectRatio.Horizontal },
        { label: 'Dọc', value: AspectRatio.Vertical },
    ];

    return (
        <div className="min-h-screen bg-gray-900 text-gray-100 font-sans p-4 sm:p-6 lg:p-8">
            <div className="max-w-7xl mx-auto">
                <header className="text-center mb-8">
                    <h1 className="text-4xl sm:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-indigo-600">
                        Personal Branding Studio
                    </h1>
                    <p className="mt-2 text-lg text-gray-400">
                        Tạo ảnh thương hiệu cá nhân chuyên nghiệp với AI
                    </p>
                </header>

                {error && (
                    <div className="bg-red-900/50 border border-red-700 text-red-300 px-4 py-3 rounded-lg relative mb-6 text-center" role="alert">
                        <span className="block sm:inline">{error}</span>
                    </div>
                )}
                
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Step 1: Upload */}
                    <div className="bg-gray-800/50 rounded-2xl p-6 border border-gray-700 flex flex-col space-y-4">
                        <h2 className="text-2xl font-semibold text-purple-300 flex items-center">
                            <span className="bg-purple-500/20 text-purple-300 rounded-full h-8 w-8 flex items-center justify-center mr-3 font-bold">1</span>
                            Tải ảnh gốc
                        </h2>
                        <input
                            type="file"
                            accept="image/*"
                            onChange={handleFileChange}
                            ref={fileInputRef}
                            className="hidden"
                        />
                        <div 
                            className="relative aspect-square w-full bg-gray-900 rounded-lg flex items-center justify-center border-2 border-dashed border-gray-600 hover:border-purple-500 transition-colors cursor-pointer"
                            onClick={() => fileInputRef.current?.click()}
                        >
                            {croppedImage ? (
                                <>
                                    <img src={croppedImage} alt="Preview" className="object-contain max-h-full max-w-full rounded-md" />
                                    {isCropping && <div className="absolute inset-0 bg-black/50 flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div></div>}
                                </>
                            ) : (
                                <div className="text-center text-gray-500">
                                    <UploadIcon className="mx-auto h-12 w-12" />
                                    <p>Nhấn để tải ảnh lên</p>
                                </div>
                            )}
                        </div>
                        <div className={originalImage ? 'block' : 'hidden'}>
                             <h3 className="font-medium mb-2 text-gray-300">Kích cỡ</h3>
                             <div className="grid grid-cols-3 gap-2">
                                {aspectRatioOptions.map(opt => (
                                    <button
                                        key={opt.value}
                                        onClick={() => setAspectRatio(opt.value)}
                                        className={`px-4 py-2 text-sm rounded-md transition-colors ${aspectRatio === opt.value ? 'bg-purple-600 text-white font-semibold' : 'bg-gray-700 hover:bg-gray-600'}`}
                                    >
                                        {opt.label}
                                    </button>
                                ))}
                             </div>
                        </div>
                    </div>

                    {/* Step 2: Describe */}
                    <div className="bg-gray-800/50 rounded-2xl p-6 border border-gray-700 flex flex-col space-y-4">
                        <h2 className="text-2xl font-semibold text-purple-300 flex items-center">
                            <span className="bg-purple-500/20 text-purple-300 rounded-full h-8 w-8 flex items-center justify-center mr-3 font-bold">2</span>
                            Mô tả ảnh mong muốn
                        </h2>
                        <textarea
                            value={prompt}
                            onChange={(e) => setPrompt(e.target.value)}
                            placeholder="Ví dụ: một bức ảnh chân dung chuyên nghiệp, mặc vest đen, đứng trong văn phòng hiện đại với nền mờ..."
                            className="flex-grow bg-gray-900 border border-gray-600 rounded-lg p-3 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors placeholder-gray-500 resize-none"
                            rows={10}
                            disabled={!croppedImage || isLoading}
                        />
                        <button
                            onClick={handleGenerateClick}
                            disabled={!croppedImage || !prompt || isLoading}
                            className="w-full flex items-center justify-center bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold py-3 px-4 rounded-lg transition-all duration-300 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <SparklesIcon className="h-5 w-5 mr-2" />
                            {isLoading ? 'Đang xử lý...' : 'Tạo ảnh'}
                        </button>
                    </div>

                    {/* Step 3: Result */}
                    <div className="bg-gray-800/50 rounded-2xl p-6 border border-gray-700 flex flex-col space-y-4">
                         <h2 className="text-2xl font-semibold text-purple-300 flex items-center">
                            <span className="bg-purple-500/20 text-purple-300 rounded-full h-8 w-8 flex items-center justify-center mr-3 font-bold">3</span>
                            Kết quả
                        </h2>
                        <div className="relative aspect-square w-full bg-gray-900 rounded-lg flex items-center justify-center border-2 border-gray-700">
                             {isLoading && (
                                <div className="text-center text-gray-400">
                                    <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-purple-400 mx-auto"></div>
                                    <p className="mt-4">AI đang sáng tạo, vui lòng chờ...</p>
                                </div>
                            )}
                            {generatedImage && !isLoading && (
                                <img 
                                    src={generatedImage} 
                                    alt="Generated" 
                                    className="object-contain max-h-full max-w-full rounded-md cursor-pointer hover:opacity-90 transition-opacity"
                                    onClick={openPreview}
                                />
                            )}
                            {!isLoading && !generatedImage && (
                                <div className="text-center text-gray-500 p-4">
                                     <SparklesIcon className="mx-auto h-12 w-12" />
                                    <p>Ảnh của bạn sẽ hiện ở đây</p>
                                </div>
                            )}
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                           <button
                                onClick={downloadImage}
                                disabled={!generatedImage || isLoading}
                                className="w-full flex items-center justify-center bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <DownloadIcon className="h-5 w-5 mr-2"/>
                                Tải xuống
                            </button>
                            <button
                                onClick={handleReset}
                                className="w-full flex items-center justify-center bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded-lg transition-colors"
                            >
                                <ResetIcon className="h-5 w-5 mr-2"/>
                                Làm lại
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {isPreviewOpen && generatedImage && (
                <div
                    className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 animate-fade-in"
                    onClick={() => setIsPreviewOpen(false)}
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="image-preview-title"
                >
                    <div
                        className="relative max-w-screen-lg max-h-[90vh] bg-gray-900 rounded-lg shadow-2xl"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <img
                            src={generatedImage}
                            alt="Generated Preview"
                            className="object-contain w-full h-full max-h-[calc(90vh-2rem)] rounded-lg"
                        />
                        <button
                            onClick={() => setIsPreviewOpen(false)}
                            className="absolute -top-4 -right-4 bg-gray-800 hover:bg-gray-700 text-white rounded-full p-2 focus:outline-none focus:ring-2 focus:ring-white transition-transform hover:scale-110"
                            aria-label="Close preview"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default App;
