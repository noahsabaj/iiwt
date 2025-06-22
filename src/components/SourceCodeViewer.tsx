import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Chip,
  LinearProgress,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  ListItemIcon,
  Divider,
  Alert,
  IconButton,
  Paper,
  Collapse,
  Button,
} from '@mui/material';
import {
  Code as CodeIcon,
  GitHub as GitHubIcon,
  Folder as FolderIcon,
  InsertDriveFile as FileIcon,
  ExpandMore as ExpandIcon,
  ExpandLess as CollapseIcon,
  OpenInNew as OpenIcon,
  ContentCopy as CopyIcon,
  Check as CheckIcon,
} from '@mui/icons-material';
import { CopyBlock, dracula } from 'react-code-blocks';

interface GitHubFile {
  name: string;
  path: string;
  type: 'file' | 'dir';
  size?: number;
  download_url?: string;
  url: string;
  children?: GitHubFile[];
}

interface SourceCodeViewerProps {
  owner?: string;
  repo?: string;
}

const SourceCodeViewer: React.FC<SourceCodeViewerProps> = ({ 
  owner = 'noahsabaj', 
  repo = 'iiwt' 
}) => {
  const [fileTree, setFileTree] = useState<GitHubFile[]>([]);
  const [selectedFile, setSelectedFile] = useState<GitHubFile | null>(null);
  const [fileContent, setFileContent] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [loadingFile, setLoadingFile] = useState(false);
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set(['src']));
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Key files to highlight
  const keyFiles = [
    'src/services/ConflictDataService.ts',
    'src/services/eventProcessor.ts',
    'src/services/nlpService.ts',
    'src/services/verificationService.ts',
    'src/components/ConflictTimeline.tsx',
    'src/components/ConflictMap.tsx',
  ];

  useEffect(() => {
    fetchRepositoryStructure();
  }, [owner, repo]);

  const fetchRepositoryStructure = async (path: string = '') => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${path}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch repository data');
      }
      
      const data = await response.json();
      
      // Build a tree structure
      const tree = await buildFileTree(data);
      setFileTree(tree);
      
      // Auto-select a key file
      const readmeFile = data.find((f: any) => f.name.toLowerCase() === 'readme.md');
      if (readmeFile) {
        handleFileSelect(readmeFile);
      }
    } catch (err) {
      setError('Unable to load repository. This may be due to GitHub API rate limits.');
      console.error('Error fetching repository:', err);
    } finally {
      setLoading(false);
    }
  };

  const buildFileTree = async (items: any[]): Promise<GitHubFile[]> => {
    const tree: GitHubFile[] = [];
    
    // Sort folders first, then files
    items.sort((a, b) => {
      if (a.type === 'dir' && b.type === 'file') return -1;
      if (a.type === 'file' && b.type === 'dir') return 1;
      return a.name.localeCompare(b.name);
    });

    for (const item of items) {
      const file: GitHubFile = {
        name: item.name,
        path: item.path,
        type: item.type,
        size: item.size,
        download_url: item.download_url,
        url: item.url,
      };

      // For important directories, fetch their contents
      if (item.type === 'dir' && ['src', 'public'].includes(item.name)) {
        try {
          const response = await fetch(item.url);
          const children = await response.json();
          file.children = await buildFileTree(children);
        } catch (err) {
          console.error(`Error fetching contents of ${item.path}:`, err);
        }
      }

      tree.push(file);
    }

    return tree;
  };

  const handleFileSelect = async (file: GitHubFile) => {
    if (file.type === 'dir') {
      // Toggle folder expansion
      const newExpanded = new Set(expandedFolders);
      if (newExpanded.has(file.path)) {
        newExpanded.delete(file.path);
      } else {
        newExpanded.add(file.path);
        // Fetch children if not already loaded
        if (!file.children) {
          try {
            const response = await fetch(file.url);
            const children = await response.json();
            file.children = await buildFileTree(children);
            setFileTree([...fileTree]); // Trigger re-render
          } catch (err) {
            console.error(`Error fetching contents of ${file.path}:`, err);
          }
        }
      }
      setExpandedFolders(newExpanded);
    } else {
      // Load file content
      setSelectedFile(file);
      setLoadingFile(true);
      try {
        const response = await fetch(file.download_url!);
        const content = await response.text();
        setFileContent(content);
      } catch (err) {
        setFileContent('Error loading file content');
      } finally {
        setLoadingFile(false);
      }
    }
  };

  const getLanguageFromFile = (filename: string): string => {
    const extension = filename.split('.').pop()?.toLowerCase();
    const languageMap: { [key: string]: string } = {
      'ts': 'typescript',
      'tsx': 'typescript',
      'js': 'javascript',
      'jsx': 'javascript',
      'json': 'json',
      'css': 'css',
      'html': 'html',
      'md': 'markdown',
      'yml': 'yaml',
      'yaml': 'yaml',
    };
    return languageMap[extension || ''] || 'text';
  };

  const renderFileTree = (items: GitHubFile[], level: number = 0): React.ReactElement[] => {
    return items.map((item) => {
      const isExpanded = expandedFolders.has(item.path);
      const isKeyFile = keyFiles.includes(item.path);
      
      return (
        <React.Fragment key={item.path}>
          <ListItem disablePadding sx={{ pl: level * 2 }}>
            <ListItemButton
              onClick={() => handleFileSelect(item)}
              selected={selectedFile?.path === item.path}
              sx={{
                py: 0.5,
                backgroundColor: isKeyFile ? 'rgba(255, 152, 0, 0.1)' : 'transparent',
              }}
            >
              <ListItemIcon sx={{ minWidth: 30 }}>
                {item.type === 'dir' ? (
                  <FolderIcon sx={{ fontSize: 18, color: '#ff9800' }} />
                ) : (
                  <FileIcon sx={{ fontSize: 18, color: '#2196f3' }} />
                )}
              </ListItemIcon>
              <ListItemText 
                primary={
                  <Typography variant="body2" sx={{ fontSize: '0.875rem' }}>
                    {item.name}
                    {isKeyFile && (
                      <Chip 
                        label="KEY" 
                        size="small" 
                        sx={{ ml: 1, height: 16, fontSize: '0.65rem' }}
                        color="warning"
                      />
                    )}
                  </Typography>
                }
              />
              {item.type === 'dir' && (
                <IconButton size="small" edge="end">
                  {isExpanded ? <CollapseIcon /> : <ExpandIcon />}
                </IconButton>
              )}
            </ListItemButton>
          </ListItem>
          {item.type === 'dir' && item.children && (
            <Collapse in={isExpanded} timeout="auto" unmountOnExit>
              <List disablePadding>
                {renderFileTree(item.children, level + 1)}
              </List>
            </Collapse>
          )}
        </React.Fragment>
      );
    });
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(fileContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <Card sx={{ height: '100%' }}>
        <CardContent>
          <LinearProgress />
          <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
            Loading repository structure...
          </Typography>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card sx={{ height: '100%', maxHeight: '800px', display: 'flex', flexDirection: 'column' }}>
      <CardContent sx={{ pb: 0 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <CodeIcon sx={{ mr: 1, color: '#ff5722' }} />
          <Typography variant="h6" component="h2" sx={{ fontWeight: 600, flexGrow: 1 }}>
            SOURCE CODE
          </Typography>
          <Button
            startIcon={<GitHubIcon />}
            endIcon={<OpenIcon sx={{ fontSize: 14 }} />}
            size="small"
            href={`https://github.com/${owner}/${repo}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            View on GitHub
          </Button>
        </Box>

        {error ? (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        ) : (
          <Alert severity="info" sx={{ mb: 2, fontSize: '0.875rem' }}>
            Browse the complete source code. Key files are highlighted for transparency.
          </Alert>
        )}
      </CardContent>

      <Box sx={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {/* File Tree */}
        <Box sx={{ 
          width: 300, 
          borderRight: 1, 
          borderColor: 'divider',
          overflow: 'auto',
          backgroundColor: '#0a0a0a'
        }}>
          <List dense sx={{ py: 0 }}>
            {renderFileTree(fileTree)}
          </List>
        </Box>

        {/* Code Viewer */}
        <Box sx={{ flex: 1, overflow: 'auto', p: 2 }}>
          {selectedFile ? (
            <>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Typography variant="body2" sx={{ flexGrow: 1, fontFamily: 'monospace' }}>
                  {selectedFile.path}
                </Typography>
                <IconButton 
                  size="small" 
                  onClick={handleCopyCode}
                  sx={{ ml: 1 }}
                >
                  {copied ? <CheckIcon sx={{ fontSize: 18 }} /> : <CopyIcon sx={{ fontSize: 18 }} />}
                </IconButton>
              </Box>
              
              {loadingFile ? (
                <LinearProgress />
              ) : (
                <Box sx={{ 
                  maxHeight: '600px', 
                  overflow: 'auto',
                  '& > div': {
                    fontSize: '0.875rem !important',
                  }
                }}>
                  <CopyBlock
                    text={fileContent}
                    language={getLanguageFromFile(selectedFile.name)}
                    showLineNumbers={true}
                    theme={dracula}
                    codeBlock
                  />
                </Box>
              )}
            </>
          ) : (
            <Paper sx={{ p: 4, textAlign: 'center', backgroundColor: '#0a0a0a' }}>
              <CodeIcon sx={{ fontSize: 48, color: '#333', mb: 2 }} />
              <Typography variant="body2" color="text.secondary">
                Select a file to view its source code
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                Key files are highlighted in orange
              </Typography>
            </Paper>
          )}
        </Box>
      </Box>
    </Card>
  );
};

export default SourceCodeViewer;