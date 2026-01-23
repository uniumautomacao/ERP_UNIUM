import React, { useEffect, useRef, useState } from 'react';
import mermaid from 'mermaid';
import elkLayouts from '@mermaid-js/layout-elk';
import { jsPDF } from 'jspdf';
import { Button, makeStyles, tokens, Spinner } from '@fluentui/react-components';
import { ArrowDownload24Regular, DocumentPdf24Regular } from '@fluentui/react-icons';

const useStyles = makeStyles({
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalM,
    width: '100%',
  },
  toolbar: {
    display: 'flex',
    gap: tokens.spacingHorizontalS,
    justifyContent: 'flex-end',
  },
  diagramContainer: {
    width: '100%',
    overflowX: 'auto',
    backgroundColor: tokens.colorNeutralBackground1,
    padding: tokens.spacingHorizontalM,
    borderRadius: tokens.borderRadiusMedium,
    border: `1px solid ${tokens.colorNeutralStroke1}`,
    minHeight: '200px',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
  },
  mermaid: {
    width: '100%',
    textAlign: 'center',
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
    useMaxWidth: true,
    htmlLabels: true,
    defaultRenderer: 'elk',
  }
});

interface MermaidDiagramProps {
  chart: string;
}

export const MermaidDiagram: React.FC<MermaidDiagramProps> = ({ chart }) => {
  const styles = useStyles();
  const containerRef = useRef<HTMLDivElement>(null);
  const [isRendering, setIsRendering] = useState(false);
  const [renderError, setRenderError] = useState<string | null>(null);

  useEffect(() => {
    const renderChart = async () => {
      if (containerRef.current && chart) {
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
          // Keep the error message visible but simple
          containerRef.current.innerHTML = `<div style="color: red; padding: 20px;">Erro na sintaxe do diagrama</div>`;
        } finally {
          setIsRendering(false);
        }
      }
    };

    renderChart();
  }, [chart]);

  const handleExportImage = async () => {
    const svgElement = containerRef.current?.querySelector('svg');
    if (!svgElement) return;

    try {
      // 1. Serialize SVG to string
      const serializer = new XMLSerializer();
      const svgString = serializer.serializeToString(svgElement);
      
      // 2. Create Blob and URL
      const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
      const url = URL.createObjectURL(svgBlob);
      
      // 3. Load into HTML Image
      const img = new Image();
      img.onload = () => {
        // 4. Draw on Canvas
        const canvas = document.createElement('canvas');
        // Scale up for better resolution (Retina)
        const scale = 2;
        const width = (svgElement.clientWidth || parseInt(svgElement.getAttribute('width') || '800')) * scale;
        const height = (svgElement.clientHeight || parseInt(svgElement.getAttribute('height') || '600')) * scale;
        
        canvas.width = width;
        canvas.height = height;
        
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        
        // White background
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        ctx.drawImage(img, 0, 0, width, height);
        
        // 5. Download
        const link = document.createElement('a');
        link.download = `diagrama-mermaid-${new Date().getTime()}.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
        
        URL.revokeObjectURL(url);
      };
      img.src = url;
    } catch (error) {
      console.error('Error exporting image:', error);
    }
  };

  const handleExportPDF = () => {
    const svgElement = containerRef.current?.querySelector('svg');
    if (!svgElement) return;

    try {
      // Reuse image generation logic for PDF
      const serializer = new XMLSerializer();
      const svgString = serializer.serializeToString(svgElement);
      const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
      const url = URL.createObjectURL(svgBlob);
      
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        // Use standard scale for PDF
        const scale = 2;
        const width = (svgElement.clientWidth || parseInt(svgElement.getAttribute('width') || '800')) * scale;
        const height = (svgElement.clientHeight || parseInt(svgElement.getAttribute('height') || '600')) * scale;
        
        canvas.width = width;
        canvas.height = height;
        
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, width, height);
        
        const imgData = canvas.toDataURL('image/png');
        
        // Create PDF
        // Orientation depends on aspect ratio
        const orientation = width > height ? 'l' : 'p';
        const pdf = new jsPDF({
          orientation,
          unit: 'px',
          format: [width / scale, height / scale] // Use original dimensions for PDF size
        });
        
        pdf.addImage(imgData, 'PNG', 0, 0, width / scale, height / scale);
        pdf.save(`diagrama-${new Date().getTime()}.pdf`);
        
        URL.revokeObjectURL(url);
      };
      img.src = url;
    } catch (error) {
      console.error('Error exporting PDF:', error);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.toolbar}>
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
      
      <div className={styles.diagramContainer}>
        {isRendering && <Spinner label="Renderizando diagrama..." />}
        <div ref={containerRef} className={styles.mermaid} />
      </div>
      
      {renderError && (
        <div style={{ color: tokens.colorPaletteRedForeground1, fontSize: tokens.fontSizeBase200 }}>
          {renderError}
        </div>
      )}
    </div>
  );
};
