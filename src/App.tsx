import React, { useState, useEffect } from 'react';
import { 
  Wand2, 
  Image as ImageIcon, 
  Loader2, 
  Download, 
  RefreshCw, 
  Moon, 
  Sun, 
  Sliders, 
  X,
  ChevronDown,
  ImagePlus,
  Clock,
  Trash2,
  ChevronRight,
  Menu,
  ExternalLink
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import './App.css';

// Types
type AspectRatio = '1:1' | '16:9' | '9:16' | '4:3' | '3:4' | '3:2' | '2:3';
type StylePreset = 'photographic' | 'digital-art' | 'anime' | 'cinematic' | 'fantasy' | 'neon-punk' | 'abstract';
type ImageQuality = 'standard' | 'hd';

interface GeneratedImage {
  id: string;
  url: string;
  prompt: string;
  timestamp: number;
  aspectRatio: AspectRatio;
}

interface ImageSettings {
  aspectRatio: AspectRatio;
  stylePreset: StylePreset;
  quality: ImageQuality;
  steps: number;
  guidance: number;
}

function App() {
  // Theme state
  const [darkMode, setDarkMode] = useState<boolean>(true);
  
  // Form state
  const [prompt, setPrompt] = useState<string>('');
  const [negativePrompt, setNegativePrompt] = useState<string>('');
  const [showAdvancedSettings, setShowAdvancedSettings] = useState<boolean>(false);
  
  // Mobile menu state
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);
  
  // Image generation state
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  // Gallery state
  const [recentImages, setRecentImages] = useState<GeneratedImage[]>([]);
  
  // Settings state
  const [settings, setSettings] = useState<ImageSettings>({
    aspectRatio: '1:1',
    stylePreset: 'photographic',
    quality: 'standard',
    steps: 30,
    guidance: 7.5
  });

  // Load saved images and theme preference from localStorage on mount
  useEffect(() => {
    const savedImages = localStorage.getItem('recentImages');
    if (savedImages) {
      setRecentImages(JSON.parse(savedImages));
    }
    
    const savedTheme = localStorage.getItem('darkMode');
    if (savedTheme !== null) {
      setDarkMode(savedTheme === 'true');
    }
  }, []);

  // Update localStorage when images or theme changes
  useEffect(() => {
    localStorage.setItem('recentImages', JSON.stringify(recentImages));
  }, [recentImages]);

  useEffect(() => {
    localStorage.setItem('darkMode', String(darkMode));
    document.documentElement.classList.toggle('dark', darkMode);
  }, [darkMode]);

  const toggleTheme = () => {
    setDarkMode(!darkMode);
  };

  const getResolutionFromAspectRatio = (ratio: AspectRatio): { width: number, height: number } => {
    // Base size to maintain reasonable file sizes
    const baseSize = 768;
    
    switch (ratio) {
      case '1:1': return { width: baseSize, height: baseSize };
      case '16:9': return { width: Math.floor(baseSize * 16/9), height: baseSize };
      case '9:16': return { width: baseSize, height: Math.floor(baseSize * 16/9) };
      case '4:3': return { width: Math.floor(baseSize * 4/3), height: baseSize };
      case '3:4': return { width: baseSize, height: Math.floor(baseSize * 4/3) };
      case '3:2': return { width: Math.floor(baseSize * 3/2), height: baseSize };
      case '2:3': return { width: baseSize, height: Math.floor(baseSize * 3/2) };
      default: return { width: baseSize, height: baseSize };
    }
  };

  const generateImage = async () => {
    if (!prompt.trim()) {
      setError('Please enter a prompt to generate an image');
      return;
    }

    // Check if API token is set
    const apiToken = import.meta.env.VITE_HUGGINGFACE_API_TOKEN;
    if (!apiToken || apiToken === 'YOUR_HUGGINGFACE_API_TOKEN_HERE') {
      setError(
        'Hugging Face API token is not configured. Please:\n' +
        '1. Get your API token from https://huggingface.co/settings/tokens\n' +
        '2. Create a .env file in your project root\n' +
        '3. Add: VITE_HUGGINGFACE_API_TOKEN=your_token_here\n' +
        '4. Restart the development server'
      );
      return;
    }

    setIsLoading(true);
    setError(null);
    
    try {
      // Build the prompt with style preset
      const fullPrompt = `${prompt}${settings.stylePreset !== 'photographic' ? `, ${settings.stylePreset} style` : ''}`;
      
      const response = await fetch(
        "https://api-inference.huggingface.co/models/CompVis/stable-diffusion-v1-4",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiToken}`,
          },
          body: JSON.stringify({
            inputs: fullPrompt,
          }),
        }
      );

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Invalid API token. Please check your Hugging Face API token and ensure it has the necessary permissions.');
        } else if (response.status === 503) {
          throw new Error('Model is currently loading. Please try again in a few moments.');
        } else if (response.status === 400) {
          throw new Error('Bad request. Please check your prompt and try again.');
        }
        throw new Error(`API request failed with status ${response.status}`);
      }

      const blob = await response.blob();
      const imageUrl = URL.createObjectURL(blob);
      setGeneratedImage(imageUrl);
      
      // Add to recent images
      const newImage: GeneratedImage = {
        id: Date.now().toString(),
        url: imageUrl,
        prompt,
        timestamp: Date.now(),
        aspectRatio: settings.aspectRatio
      };
      
      setRecentImages(prev => [newImage, ...prev.slice(0, 11)]);
      
    } catch (err) {
      console.error('Error generating image:', err);
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Failed to generate image. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const downloadImage = (url: string) => {
    if (!url) return;
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `dreamcanvas-${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const resetForm = () => {
    setPrompt('');
    setNegativePrompt('');
    setGeneratedImage(null);
    setError(null);
    setSettings({
      aspectRatio: '1:1',
      stylePreset: 'photographic',
      quality: 'standard',
      steps: 30,
      guidance: 7.5
    });
    setShowAdvancedSettings(false);
  };
  
  const deleteImage = (id: string) => {
    setRecentImages(prev => prev.filter(img => img.id !== id));
  };

  const clearAllImages = () => {
    setRecentImages([]);
  };

  return (
    <div className={`min-h-screen transition-colors duration-300 ${darkMode ? 'bg-gradient-dual from-gray-900 via-primary-900 to-secondary-900' : 'bg-gradient-dual from-primary-50 via-primary-100 to-secondary-100'}`}>
      {/* Header */}
      <header className="relative z-20">
        <nav className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Wand2 className={`h-8 w-8 ${darkMode ? 'text-primary-400' : 'text-primary-600'}`} />
              <h1 className="font-display text-xl md:text-2xl font-bold gradient-text">DreamCanvas AI</h1>
            </div>
            
            <div className="hidden md:flex items-center gap-8">
              <a href="#features" className={`font-medium hover:text-primary-400 transition-colors ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Features</a>
              <a href="#gallery" className={`font-medium hover:text-primary-400 transition-colors ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Gallery</a>
              <a href="#pricing" className={`font-medium hover:text-primary-400 transition-colors ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Pricing</a>
              <button onClick={toggleTheme} className={`p-2 rounded-full ${darkMode ? 'bg-gray-800 hover:bg-gray-700' : 'bg-white hover:bg-gray-100 shadow-md'} transition-colors`}>
                {darkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
              </button>
            </div>
            
            <button 
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} 
              className="md:hidden p-2"
              aria-label="Toggle menu"
            >
              <Menu className="h-6 w-6" />
            </button>
          </div>

          {/* Mobile Menu */}
          <AnimatePresence>
            {isMobileMenuOpen && (
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className={`absolute top-full left-0 right-0 p-4 ${darkMode ? 'bg-gray-800' : 'bg-white'} shadow-lg rounded-b-lg md:hidden`}
              >
                <div className="flex flex-col gap-4">
                  <a href="#features" className={`font-medium hover:text-primary-400 transition-colors ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Features</a>
                  <a href="#gallery" className={`font-medium hover:text-primary-400 transition-colors ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Gallery</a>
                  <a href="#pricing" className={`font-medium hover:text-primary-400 transition-colors ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Pricing</a>
                  <button 
                    onClick={() => {
                      toggleTheme();
                      setIsMobileMenuOpen(false);
                    }}
                    className={`flex items-center gap-2 font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}
                  >
                    {darkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
                    {darkMode ? 'Light Mode' : 'Dark Mode'}
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </nav>

        {/* Hero Section */}
        <div className="container mx-auto px-4 py-8 md:py-16 lg:py-24">
          <div className="grid md:grid-cols-2 gap-8 md:gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-center md:text-left"
            >
              <h2 className="font-display text-3xl md:text-4xl lg:text-6xl font-bold mb-4 md:mb-6 gradient-text">
                Creativity, Unleashed.
              </h2>
              <p className={`text-base md:text-lg lg:text-xl mb-6 md:mb-8 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Transform your ideas into stunning visuals with our AI-powered image generation platform. Create unique, high-quality images in seconds.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center md:justify-start">
                <button className="px-6 py-3 rounded-lg bg-primary-600 hover:bg-primary-700 text-white font-medium transition-colors">
                  Get Started
                </button>
                <button className={`px-6 py-3 rounded-lg ${darkMode ? 'bg-gray-800 hover:bg-gray-700 text-white' : 'bg-white hover:bg-gray-100 text-gray-800 shadow-md'} font-medium transition-colors flex items-center justify-center gap-2`}>
                  Learn More <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="relative order-first md:order-last"
            >
              <div className="absolute inset-0 bg-gradient-radial from-primary-500/30 to-transparent blur-3xl -z-10" />
              <div className="rounded-2xl overflow-hidden shadow-2xl">
                <img
                  src="https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1000&q=80"
                  alt="AI Generated Art Example"
                  className="w-full h-auto"
                />
              </div>
            </motion.div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-4 max-w-6xl">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-8">
          <motion.div 
            className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl p-4 md:p-6 shadow-lg`}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h2 className="text-xl font-semibold mb-4">Create Your Image</h2>
            
            <div className="mb-4">
              <label htmlFor="prompt" className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-1`}>
                Prompt
              </label>
              <textarea
                id="prompt"
                rows={4}
                className={`w-full px-4 py-2 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
                  darkMode 
                    ? 'bg-gray-700 border border-gray-600 text-white placeholder-gray-400' 
                    : 'bg-gray-50 border border-gray-200 text-gray-800 placeholder-gray-500'
                }`}
                placeholder="Describe the image you want to generate..."
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
              />
            </div>
            
            <div className="mb-4">
              <label htmlFor="negativePrompt" className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-1`}>
                Negative Prompt (Optional)
              </label>
              <textarea
                id="negativePrompt"
                rows={2}
                className={`w-full px-4 py-2 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
                  darkMode 
                    ? 'bg-gray-700 border border-gray-600 text-white placeholder-gray-400' 
                    : 'bg-gray-50 border border-gray-200 text-gray-800 placeholder-gray-500'
                }`}
                placeholder="Elements you want to exclude..."
                value={negativePrompt}
                onChange={(e) => setNegativePrompt(e.target.value)}
              />
              <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'} mt-1`}>
                Specify elements you don't want in the generated image
              </p>
            </div>
            
            <div className="mb-4">
              <div className="flex justify-between items-center mb-2">
                <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Aspect Ratio
                </label>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
                {(['1:1', '16:9', '9:16', '4:3', '3:4', '3:2', '2:3'] as AspectRatio[]).map((ratio) => (
                  <button
                    key={ratio}
                    type="button"
                    onClick={() => setSettings({...settings, aspectRatio: ratio})}
                    className={`py-2 px-3 rounded-md text-sm font-medium transition-colors ${
                      settings.aspectRatio === ratio
                        ? darkMode 
                          ? 'bg-purple-600 text-white' 
                          : 'bg-purple-500 text-white'
                        : darkMode
                          ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {ratio}
                  </button>
                ))}
              </div>
              
              <div className="flex justify-between items-center mb-2">
                <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Style Preset
                </label>
              </div>
              <select
                value={settings.stylePreset}
                onChange={(e) => setSettings({...settings, stylePreset: e.target.value as StylePreset})}
                className={`w-full px-4 py-2 rounded-lg mb-4 ${
                  darkMode 
                    ? 'bg-gray-700 border border-gray-600 text-white' 
                    : 'bg-gray-50 border border-gray-200 text-gray-800'
                }`}
              >
                <option value="photographic">Photographic</option>
                <option value="digital-art">Digital Art</option>
                <option value="anime">Anime</option>
                <option value="cinematic">Cinematic</option>
                <option value="fantasy">Fantasy</option>
                <option value="neon-punk">Neon Punk</option>
                <option value="abstract">Abstract</option>
              </select>
            </div>
            
            <div className="mb-6">
              <button
                type="button"
                onClick={() => setShowAdvancedSettings(!showAdvancedSettings)}
                className={`flex items-center gap-2 text-sm ${darkMode ? 'text-purple-400 hover:text-purple-300' : 'text-purple-600 hover:text-purple-700'}`}
              >
                <Sliders className="h-4 w-4" />
                {showAdvancedSettings ? 'Hide' : 'Show'} Advanced Settings
                <ChevronDown className={`h-4 w-4 transition-transform ${showAdvancedSettings ? 'rotate-180' : ''}`} />
              </button>
              
              <AnimatePresence>
                {showAdvancedSettings && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="overflow-hidden"
                  >
                    <div className={`mt-4 p-4 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
                      <div className="mb-4">
                        <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-1`}>
                          Quality: {settings.quality === 'standard' ? 'Standard' : 'HD'}
                        </label>
                        <div className="flex gap-3">
                          <button
                            type="button"
                            onClick={() => setSettings({...settings, quality: 'standard'})}
                            className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
                              settings.quality === 'standard'
                                ? darkMode 
                                  ? 'bg-purple-600 text-white' 
                                  : 'bg-purple-500 text-white'
                                : darkMode
                                  ? 'bg-gray-600 text-gray-300 hover:bg-gray-500'
                                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                            }`}
                          >
                            Standard
                          </button>
                          <button
                            type="button"
                            onClick={() => setSettings({...settings, quality: 'hd'})}
                            className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
                              settings.quality === 'hd'
                                ? darkMode 
                                  ? 'bg-purple-600 text-white' 
                                  : 'bg-purple-500 text-white'
                                : darkMode
                                  ? 'bg-gray-600 text-gray-300 hover:bg-gray-500'
                                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                            }`}
                          >
                            HD
                          </button>
                        </div>
                      </div>
                      
                      <div className="mb-4">
                        <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-1`}>
                          Steps: {settings.steps}
                        </label>
                        <input
                          type="range"
                          min="20"
                          max="50"
                          step="5"
                          value={settings.steps}
                          onChange={(e) => setSettings({...settings, steps: parseInt(e.target.value)})}
                          className="w-full"
                        />
                        <div className="flex justify-between text-xs mt-1">
                          <span>Faster</span>
                          <span>Better Quality</span>
                        </div>
                      </div>
                      
                      <div>
                        <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-1`}>
                          Guidance Scale: {settings.guidance}
                        </label>
                        <input
                          type="range"
                          min="1"
                          max="20"
                          step="0.5"
                          value={settings.guidance}
                          onChange={(e) => setSettings({...settings, guidance: parseFloat(e.target.value)})}
                          className="w-full"
                        />
                        <div className="flex justify-between text-xs mt-1">
                          <span>More Creative</span>
                          <span>More Precise</span>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={generateImage}
                disabled={isLoading}
                className={`flex-1 font-medium py-2 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors disabled:opacity-70 disabled:cursor-not-allowed ${
                  darkMode
                    ? 'bg-purple-600 hover:bg-purple-700 text-white'
                    : 'bg-purple-500 hover:bg-purple-600 text-white'
                }`}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Wand2 className="h-5 w-5" />
                    Generate Image
                  </>
                )}
              </button>
              
              <button
                onClick={resetForm}
                className={`${
                  darkMode
                    ? 'bg-gray-700 hover:bg-gray-600 text-white'
                    : 'bg-gray-200 hover:bg-gray-300 text-gray-800'
                } font-medium py-2 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors`}
              >
                <RefreshCw className="h-5 w-5" />
              </button>
            </div>
            
            {error && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`mt-4 p-3 rounded-lg text-sm whitespace-pre-line ${
                  darkMode
                    ? 'bg-red-900/50 border border-red-700 text-red-200'
                    : 'bg-red-100 border border-red-300 text-red-800'
                }`}
              >
                {error}
              </motion.div>
            )}
          </motion.div>
          
          <motion.div 
            className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl p-4 md:p-6 shadow-lg flex flex-col`}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h2 className="text-xl font-semibold mb-4">Generated Image</h2>
            
            <div className={`flex-1 flex items-center justify-center rounded-lg overflow-hidden ${
              darkMode ? 'bg-gray-700/50' : 'bg-gray-100'
            }`}>
              {isLoading ? (
                <motion.div 
                  className="flex flex-col items-center justify-center p-8"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  <Loader2 className={`h-12 w-12 ${darkMode ? 'text-purple-400' : 'text-purple-500'} animate-spin mb-4`} />
                  <p className={`${darkMode ? 'text-gray-400' : 'text-gray-500'} text-center`}>Creating your masterpiece...</p>
                </motion.div>
              ) : generatedImage ? (
                <motion.div 
                  className="relative w-full h-full flex items-center justify-center p-4"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.5 }}
                >
                  <img 
                    src={generatedImage} 
                    alt="AI Generated" 
                    className="max-w-full max-h-[400px] object-contain rounded-lg shadow-lg"
                  />
                  <button
                    onClick={() => downloadImage(generatedImage)}
                    className={`absolute bottom-8 right-8 p-3 rounded-full transition-colors ${
                      darkMode
                        ? 'bg-gray-800/80 hover:bg-gray-700'
                        : 'bg-white/90 hover:bg-gray-100 shadow-md'
                    }`}
                    title="Download Image"
                  >
                    <Download className="h-5 w-5" />
                  </button>
                </motion.div>
              ) : (
                <div className="flex flex-col items-center justify-center p-8">
                  <ImageIcon className={`h-16 w-16 ${darkMode ? 'text-gray-600' : 'text-gray-300'} mb-4`} />
                  <p className={`${darkMode ? 'text-gray-400' : 'text-gray-500'} text-center`}>Your generated image will appear here</p>
                </div>
              )}
            </div>
          </motion.div>
        </div>
        
        {/* Gallery Section */}
        <motion.div 
          className={`mt-8 md:mt-12 ${darkMode ? 'bg-gray-800/50' : 'bg-white'} rounded-xl p-4 md:p-6 shadow-lg`}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <h2 className="text-xl font-semibold">Your Gallery</h2>
            {recentImages.length > 0 && (
              <button
                onClick={clearAllImages}
                className={`text-sm py-1 px-3 rounded ${
                  darkMode
                    ? 'bg-red-900/30 hover:bg-red-900/50 text-red-300'
                    : 'bg-red-100 hover:bg-red-200 text-red-700'
                } transition-colors`}
              >
                Clear All
              </button>
            )}
          </div>
          
          {recentImages.length === 0 ? (
            <div className={`flex flex-col items-center justify-center py-12 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              <ImagePlus className="h-12 w-12 mb-4 opacity- 50" />
              <p>Your generated images will appear here</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {recentImages.map((image) => (
                <motion.div 
                  key={image.id}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className={`relative group rounded-lg overflow-hidden ${
                    darkMode ? 'bg-gray-700' : 'bg-gray-100'
                  } aspect-square`}
                >
                  <img 
                    src={image.url} 
                    alt={image.prompt} 
                    className="w-full h-full object-cover"
                  />
                  <div className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200 ${
                    darkMode ? 'bg-gray-900/70' : 'bg-gray-800/60'
                  } flex flex-col justify-between p-3`}>
                    <div className="flex justify-end">
                      <button
                        onClick={() => deleteImage(image.id)}
                        className="p-1.5 rounded-full bg-red-500/80 hover:bg-red-600 text-white"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                    <div>
                      <p className="text-white text-xs line-clamp-2 mb-1">{image.prompt}</p>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-300 text-xs flex items-center">
                          <Clock className="h-3 w-3 mr-1" />
                          {new Date(image.timestamp).toLocaleDateString()}
                        </span>
                        <button
                          onClick={() => downloadImage(image.url)}
                          className="p-1.5 rounded-full bg-gray-700/80 hover:bg-gray-600 text-white"
                        >
                          <Download className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      </main>
      
      <footer className={`mt-8 md:mt-12 py-6 md:py-8 ${darkMode ? 'bg-gray-800/30' : 'bg-white/80'} rounded-t-xl`}>
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2">
              <Wand2 className={`h-6 w-6 ${darkMode ? 'text-primary-400' : 'text-primary-600'}`} />
              <span className="font-display text-lg font-bold gradient-text">DreamCanvas AI</span>
            </div>
            <div className="flex flex-wrap justify-center items-center gap-4 md:gap-6">
              <a href="#privacy" className={`text-sm ${darkMode ? 'text-gray-400 hover:text-gray-300' : 'text-gray-600 hover:text-gray-800'} transition-colors`}>Privacy Policy</a>
              <a href="#terms" className={`text-sm ${darkMode ? 'text-gray-400 hover:text-gray-300' : 'text-gray-600 hover:text-gray-800'} transition-colors`}>Terms of Service</a>
              <a href="#contact" className={`text-sm ${darkMode ? 'text-gray-400 hover:text-gray-300' : 'text-gray-600 hover:text-gray-800'} transition-colors`}>Contact</a>
            </div>
            <p className={`text-sm text-center md:text-left ${darkMode ? 'text-gray-500' : 'text-gray-600'}`}>
              © {new Date().getFullYear()} DreamCanvas AI. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;