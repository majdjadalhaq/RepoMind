import { useChatStore } from '../../application/store/chat-store';
import { FileContext } from '../../core/types';
import { readFile } from '../../core/utils';

export const useFileHandler = () => {
  const { activeFiles, setActiveFiles } = useChatStore();

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const allNewFiles: FileContext[] = [];

      for (let i = 0; i < e.target.files.length; i++) {
        try {
          const extractedFiles = await readFile(e.target.files[i]);
          allNewFiles.push(...extractedFiles);
        } catch {
          // Ignore read errors
        }
      }

      setActiveFiles([...activeFiles, ...allNewFiles]);
    }
  };

  return { handleFileChange };
};
