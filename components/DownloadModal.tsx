import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Loader2, Download, ExternalLink, AlertCircle } from 'lucide-react';
import { getDownloadLinks, type DownloadResult } from '@/api/downloadService';
import { getTelegramUrlForSeries } from '@/api/telegramService';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface DownloadModalProps {
  open: boolean;
  onClose: () => void;
  tmdbId: string;
  title: string;
  contentType?: 'movie' | 'tv';
}

const DownloadModal = ({ open, onClose, tmdbId, title, contentType = 'movie' }: DownloadModalProps) => {
  const [downloadData, setDownloadData] = useState<DownloadResult | null>(null);
  const [telegramUrl, setTelegramUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open && tmdbId) {
      fetchDownloadData();
    }
  }, [open, tmdbId, contentType]);

  const fetchDownloadData = async () => {
    setLoading(true);
    try {
      if (contentType === 'movie') {
        const result = await getDownloadLinks(tmdbId);
        setDownloadData(result);
      } else {
        // For TV series, fetch Telegram URL
        const telegramResult = await getTelegramUrlForSeries(parseInt(tmdbId));
        setTelegramUrl(telegramResult);
      }
    } catch (error) {
      console.error('Error fetching download links:', error);
      if (contentType === 'movie') {
        setDownloadData({
          tmdbId,
          type: 'movie',
          categories: {},
          error: 'Failed to fetch download links'
        });
      } else {
        setTelegramUrl(null);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLinkClick = (url: string) => {
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const renderDownloadLinks = () => {
    // For TV series, render Telegram link
    if (contentType === 'tv') {
      if (telegramUrl) {
        return (
          <div className="space-y-4">
            <div className="text-center">
              <p className="text-sm text-muted-foreground mb-4">
                Click the button below to access all episodes of this series via Telegram
              </p>
              <Button 
                onClick={() => handleLinkClick(telegramUrl)}
                className="w-full bg-blue-500 hover:bg-blue-600"
                size="lg"
              >
                <ExternalLink className="mr-2 h-4 w-4" />
                Download Series from Telegram
              </Button>
            </div>
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                This will open Telegram where you can find all episodes and seasons of this series.
              </AlertDescription>
            </Alert>
          </div>
        );
      } else {
        return (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              No download links available for this series. Please try again later.
            </AlertDescription>
          </Alert>
        );
      }
    }

    // For movies, use existing logic
    if (!downloadData) return null;

    if (downloadData.error) {
      return (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{downloadData.error}</AlertDescription>
        </Alert>
      );
    }

    // Filter available categories and order them: 480p, 720p, 1080p
    const preferredOrder = ['480p', '720p', '1080p'];
    const availableCategories = Object.entries(downloadData.categories)
      .filter(([category, links]) => {
        if (!links || !Array.isArray(links)) return false;
        return links.some(link => 
          link !== 'No links available' && 
          link !== 'No message_id found' && 
          link !== 'API Error - Please try again' &&
          link.startsWith('https://telegram.dog/Phonofilmbot?start=')
        );
      })
      .sort(([a], [b]) => {
        const indexA = preferredOrder.indexOf(a);
        const indexB = preferredOrder.indexOf(b);
        if (indexA === -1 && indexB === -1) return 0;
        if (indexA === -1) return 1;
        if (indexB === -1) return -1;
        return indexA - indexB;
      });

    if (availableCategories.length === 0) {
      return (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>No download links available for this content.</AlertDescription>
        </Alert>
      );
    }

    return (
      <div className="space-y-4">
        {availableCategories.map(([category, links]) => (
          <div key={category} className="space-y-2">
            <h4 className="font-medium text-sm uppercase tracking-wide text-muted-foreground">
              {category.toUpperCase()}
            </h4>
            <div className="space-y-2">
              {Array.isArray(links) && links
                .filter(link => 
                  link !== 'No links available' && 
                  link !== 'No message_id found' && 
                  link !== 'API Error - Please try again' &&
                  link.startsWith('https://telegram.dog/Phonofilmbot?start=')
                )
                .map((link, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    size="sm"
                    onClick={() => handleLinkClick(link)}
                    className="w-full justify-start"
                  >
                    <Download className="mr-2 h-4 w-4" />
                    Download Option {index + 1}
                  </Button>
                ))}
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            Download {contentType === 'tv' ? 'Series' : 'Movie'}: {title}
          </DialogTitle>
        </DialogHeader>
        
        <div className="py-4">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin" />
              <span className="ml-2 text-sm text-muted-foreground">
                {contentType === 'tv' ? 'Fetching series download link...' : 'Fetching download links...'}
              </span>
            </div>
          ) : (
            renderDownloadLinks()
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default DownloadModal;