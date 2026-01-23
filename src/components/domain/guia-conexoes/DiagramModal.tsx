import React, { useEffect, useRef, useState } from 'react';
import mermaid from 'mermaid';
import elkLayouts from '@mermaid-js/layout-elk';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import {
  Button,
  makeStyles,
  tokens,
  Spinner,
  Dialog,
  DialogSurface,
  DialogBody,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@fluentui/react-components';
import {
  ArrowDownload24Regular,
  DocumentPdf24Regular,
  Image24Regular,
  Dismiss24Regular,
} from '@fluentui/react-icons';

const useStyles = makeStyles({
  surface: {
    width: '95vw',
    height: '95vh',
    maxWidth: '100vw',
    maxHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
  },
  body: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    gap: tokens.spacingVerticalM,
  },
  content: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    padding: 0,
  },
  toolbar: {
    display: 'flex',
    gap: tokens.spacingHorizontalS,
    justifyContent: 'flex-end',
    marginBottom: tokens.spacingVerticalS,
  },
  diagramContainer: {
    flex: 1,
    width: '100%',
    overflow: 'auto',
    backgroundColor: tokens.colorNeutralBackground1,
    padding: tokens.spacingHorizontalM,
    borderRadius: tokens.borderRadiusMedium,
    border: `1px solid ${tokens.colorNeutralStroke1}`,
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'start', // Align to top so large diagrams scroll naturally
  },
  mermaid: {
    width: '100%',
    textAlign: 'center',
    backgroundColor: 'white',
  },
});

// Register ELK layout
mermaid.registerLayoutLoaders(elkLayouts);

// Initialize mermaid
mermaid.initialize({
  startOnLoad: false,
  theme: 'base',
  securityLevel: 'loose',
  fontFamily: 'Segoe UI, sans-serif',
  flowchart: {
    useMaxWidth: false, // Allow horizontal scrolling
    htmlLabels: true,
    defaultRenderer: 'elk',
  },
});

interface DiagramModalProps {
  open: boolean;
  chart: string;
  onClose: () => void;
}

export const DiagramModal: React.FC<DiagramModalProps> = ({
  open,
  chart,
  onClose,
}) => {
  const styles = useStyles();
  const containerRef = useRef<HTMLDivElement>(null);
  const [isRendering, setIsRendering] = useState(false);
  const [renderError, setRenderError] = useState<string | null>(null);

  useEffect(() => {
    const renderChart = async () => {
      if (open && containerRef.current && chart) {
        setIsRendering(true);
        setRenderError(null);

        // Clear previous content
        containerRef.current.removeAttribute('data-processed');
        containerRef.current.innerHTML = '';

        try {
          // Generate a unique ID for the diagram
          const id = `mermaid-${Math.random().toString(36).substr(2, 9)}`;

          // Render the diagram
          const { svg } = await mermaid.render(id, chart);
          containerRef.current.innerHTML = svg;
        } catch (error) {
          console.error('Mermaid render error:', error);
          setRenderError('Erro ao renderizar diagrama. Verifique a sintaxe.');
          containerRef.current.innerHTML = `<div style="color: red; padding: 20px;">Erro na sintaxe do diagrama</div>`;
        } finally {
          setIsRendering(false);
        }
      }
    };

    renderChart();
  }, [open, chart]);

  const handleExportImage = async () => {
    if (!containerRef.current) return;

    try {
      const canvas = await html2canvas(containerRef.current, {
        backgroundColor: '#ffffff',
        scale: 2,
        logging: false,
        useCORS: true,
      });

      const link = document.createElement('a');
      link.download = `diagrama-mermaid-${new Date().getTime()}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (error) {
      console.error('Error exporting image:', error);
      alert('Erro ao exportar imagem. Verifique o console.');
    }
  };

  const handleExportPDF = async () => {
    if (!containerRef.current) return;

    try {
      const canvas = await html2canvas(containerRef.current, {
        backgroundColor: '#ffffff',
        scale: 2,
        logging: false,
        useCORS: true,
      });

      const imgData = canvas.toDataURL('image/png');
      const width = canvas.width;
      const height = canvas.height;
      const orientation = width > height ? 'l' : 'p';

      if (!jsPDF) {
        throw new Error('Biblioteca jsPDF não foi carregada corretamente.');
      }

      const pdf = new jsPDF({
        orientation,
        unit: 'px',
        format: [width / 2, height / 2],
      });

      pdf.addImage(imgData, 'PNG', 0, 0, width / 2, height / 2);
      pdf.save(`diagrama-${new Date().getTime()}.pdf`);
    } catch (error) {
      console.error('Erro ao gerar PDF:', error);
      alert('Ocorreu um erro ao gerar o arquivo PDF. Verifique o console.');
    }
  };

  const handleExportSVG = () => {
    if (!containerRef.current) return;
    const svgElement = containerRef.current.querySelector('svg');
    if (!svgElement) return;

    const svgData = new XMLSerializer().serializeToString(svgElement);
    const blob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `diagrama-${new Date().getTime()}.svg`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Dialog open={open} onOpenChange={(_, data) => !data.open && onClose()}>
      <DialogSurface className={styles.surface}>
        <DialogTitle
            action={
            <Button
                appearance="subtle"
                aria-label="close"
                icon={<Dismiss24Regular />}
                onClick={onClose}
            />
            }
        >
            Diagrama de Conexões
        </DialogTitle>
        <DialogBody className={styles.body}>
          <div className={styles.toolbar}>
            <Button
              icon={<Image24Regular />}
              onClick={handleExportSVG}
              disabled={isRendering || !!renderError}
            >
              Exportar SVG
            </Button>
            <Button
              icon={<ArrowDownload24Regular />}
              onClick={handleExportImage}
              disabled={isRendering || !!renderError}
            >
              Exportar PNG
            </Button>
            <Button
              icon={<DocumentPdf24Regular />}
              onClick={handleExportPDF}
              disabled={isRendering || !!renderError}
            >
              Exportar PDF
            </Button>
          </div>

          <DialogContent className={styles.content}>
            <div className={styles.diagramContainer}>
              {isRendering && <Spinner label="Renderizando diagrama..." />}
              <div ref={containerRef} className={styles.mermaid} />
            </div>

            {renderError && (
              <div
                style={{
                  color: tokens.colorPaletteRedForeground1,
                  fontSize: tokens.fontSizeBase200,
                  marginTop: tokens.spacingVerticalS,
                }}
              >
                {renderError}
              </div>
            )}
          </DialogContent>
          <DialogActions>
            <Button appearance="secondary" onClick={onClose}>
              Fechar
            </Button>
          </DialogActions>
        </DialogBody>
      </DialogSurface>
    </Dialog>
  );
};
