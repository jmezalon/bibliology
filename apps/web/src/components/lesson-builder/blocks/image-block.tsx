import { AlertCircle, Image as ImageIcon, Upload } from 'lucide-react';
import { useState } from 'react';

import { cn } from '../../../lib/utils';
import { Button } from '../../ui/button';
import { Input } from '../../ui/input';
import { Label } from '../../ui/label';

export interface ImageBlockMetadata {
  imageUrl?: string;
  imageAlt?: string;
  caption?: string;
}

interface ImageBlockProps {
  metadata: ImageBlockMetadata;
  onUpdate: (metadata: ImageBlockMetadata) => void;
  editable?: boolean;
  language?: 'en' | 'fr';
}

export function ImageBlock({
  metadata,
  onUpdate,
  editable = true,
}: ImageBlockProps) {
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);

  const validateUrl = (url: string): boolean => {
    if (!url) return false;
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  const handleUrlChange = (url: string) => {
    const newMetadata = { ...metadata, imageUrl: url };

    if (url && !validateUrl(url)) {
      setErrors({ ...errors, imageUrl: 'Please enter a valid URL' });
    } else {
      const { imageUrl: _, ...restErrors } = errors;
      setErrors(restErrors);
      setImageLoaded(false);
      setImageError(false);
    }

    onUpdate(newMetadata);
  };

  const handleAltChange = (alt: string) => {
    const newMetadata = { ...metadata, imageAlt: alt };

    if (!alt.trim()) {
      setErrors({ ...errors, imageAlt: 'Alt text is required for accessibility' });
    } else {
      const { imageAlt: _, ...restErrors } = errors;
      setErrors(restErrors);
    }

    onUpdate(newMetadata);
  };

  const handleCaptionChange = (caption: string) => {
    onUpdate({ ...metadata, caption });
  };

  const isValid = metadata.imageUrl && validateUrl(metadata.imageUrl) && metadata.imageAlt;

  return (
    <div className="space-y-4">
      {/* Image URL Input */}
      {editable && (
        <div className="space-y-2">
          <Label htmlFor="image-url" className="flex items-center gap-2">
            Image URL
            <span className="text-red-500">*</span>
          </Label>
          <div className="flex gap-2">
            <Input
              id="image-url"
              type="url"
              placeholder="https://example.com/image.jpg"
              value={metadata.imageUrl || ''}
              onChange={(e) => handleUrlChange(e.target.value)}
              className={cn(errors.imageUrl && 'border-red-500 focus-visible:ring-red-500')}
            />
            <Button
              type="button"
              variant="outline"
              className="flex-shrink-0"
              disabled
              title="File upload coming soon"
            >
              <Upload className="h-4 w-4 mr-2" />
              Upload
            </Button>
          </div>
          {errors.imageUrl && (
            <p className="text-xs text-red-600 dark:text-red-400 flex items-center gap-1">
              <AlertCircle className="h-3 w-3" />
              {errors.imageUrl}
            </p>
          )}
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Maximum file size: 5MB. Supported formats: JPG, PNG, WebP
          </p>
        </div>
      )}

      {/* Alt Text Input */}
      {editable && (
        <div className="space-y-2">
          <Label htmlFor="image-alt" className="flex items-center gap-2">
            Alt Text (Accessibility)
            <span className="text-red-500">*</span>
          </Label>
          <Input
            id="image-alt"
            type="text"
            placeholder="Describe the image for screen readers"
            value={metadata.imageAlt || ''}
            onChange={(e) => handleAltChange(e.target.value)}
            className={cn(errors.imageAlt && 'border-red-500 focus-visible:ring-red-500')}
          />
          {errors.imageAlt && (
            <p className="text-xs text-red-600 dark:text-red-400 flex items-center gap-1">
              <AlertCircle className="h-3 w-3" />
              {errors.imageAlt}
            </p>
          )}
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Describe what's in the image for visually impaired users
          </p>
        </div>
      )}

      {/* Caption Input */}
      {editable && (
        <div className="space-y-2">
          <Label htmlFor="image-caption">Caption (Optional)</Label>
          <Input
            id="image-caption"
            type="text"
            placeholder="Add a caption to display below the image"
            value={metadata.caption || ''}
            onChange={(e) => handleCaptionChange(e.target.value)}
          />
        </div>
      )}

      {/* Image Preview */}
      {metadata.imageUrl && (
        <div className="space-y-2">
          <Label>Preview</Label>
          <div className="relative rounded-lg border-2 border-gray-200 dark:border-gray-700 overflow-hidden bg-gray-50 dark:bg-gray-900">
            {!imageLoaded && !imageError && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <ImageIcon className="h-12 w-12 mx-auto text-gray-400 dark:text-gray-600 mb-2" />
                  <p className="text-sm text-gray-500 dark:text-gray-400">Loading image...</p>
                </div>
              </div>
            )}

            {imageError && (
              <div className="absolute inset-0 flex items-center justify-center p-8">
                <div className="text-center">
                  <AlertCircle className="h-12 w-12 mx-auto text-red-500 mb-2" />
                  <p className="text-sm text-red-600 dark:text-red-400">Failed to load image</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Check the URL and try again
                  </p>
                </div>
              </div>
            )}

            <img
              src={metadata.imageUrl}
              alt={metadata.imageAlt || ''}
              className={cn(
                'w-full h-auto object-contain',
                !imageLoaded && 'opacity-0',
                imageError && 'hidden',
              )}
              onLoad={() => {
                setImageLoaded(true);
                setImageError(false);
              }}
              onError={() => {
                setImageLoaded(false);
                setImageError(true);
              }}
            />
          </div>

          {/* Caption Display */}
          {metadata.caption && (
            <p className="text-sm text-gray-600 dark:text-gray-400 italic text-center">
              {metadata.caption}
            </p>
          )}
        </div>
      )}

      {/* Validation Status */}
      {editable && !isValid && (
        <div className="flex items-start gap-2 p-3 bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-lg">
          <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-amber-800 dark:text-amber-200">
            <p className="font-medium">Image block is incomplete</p>
            <ul className="list-disc list-inside mt-1 space-y-1">
              {!metadata.imageUrl && <li>Image URL is required</li>}
              {metadata.imageUrl && !validateUrl(metadata.imageUrl) && <li>Image URL must be valid</li>}
              {!metadata.imageAlt && <li>Alt text is required</li>}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
