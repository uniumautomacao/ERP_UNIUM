import React, { useState } from 'react';
import { 
  makeStyles, 
  tokens, 
  Textarea, 
  Text,
  Card,
  CardHeader,
} from '@fluentui/react-components';
import { PageContainer } from '../../components/layout/PageContainer';
import { PageHeader } from '../../components/layout/PageHeader';
import { MermaidDiagram } from '../../components/MermaidDiagram';
import { DeveloperBoard24Regular } from '@fluentui/react-icons';

const useStyles = makeStyles({
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalL,
    paddingTop: tokens.spacingVerticalL,
  },
  editorSection: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalM,
  },
  previewSection: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalM,
  },
  textarea: {
    fontFamily: 'monospace',
    minHeight: '200px',
  }
});

const DEFAULT_CHART = `graph LR
    %% Configuração para usar ELK e arestas ortogonais
    %%{init: {"flowchart": {"defaultRenderer": "elk", "nodePlacementStrategy": "BRANDES_KOEPF"}}}%%

    subgraph CE [Central de Equipamentos]
        direction LR
        Modem1[Modem (01)]
        ModemWan[Modem (01) <-> Eth01-Eth1\n(WAN)]
        Router[TL-ER605 (01)]
        RouterLink[TL-ER605 (01) <-> Eth5-\nEth1]
        Switch1[LS1008G (01)]
        Switch2[TL-SG1005P (01)]
        SmartCenter[SMART CENTER (01)]
        
        Modem1 --- ModemWan
        ModemWan --- Router
        Router --- RouterLink
        RouterLink --- Switch1
        RouterLink --- Switch2
        Switch1 --- SmartCenter
    end

    subgraph Estar
        AP_TV[EAP235-WALL (TV)]
    end

    subgraph SuiteMaster [Suite Master]
        AP_Escrivaninha[EAP615-WALL\n(Escrivaninha)]
        TV_Gen1[TV Genérica (01)]
    end

    subgraph Suite01 [Suite 01]
        TV_Gen2[TV Genérica (02)]
    end

    subgraph Suite02 [Suite 02]
        TV_Gen3[TV Genérica (03)]
    end

    subgraph Cozinha
        TV_Gen4[TV Genérica (04)]
    end

    %% Conexões Externas
    Switch2 --- AP_TV
    Switch2 --- AP_Escrivaninha
    Switch1 --- TV_Gen1
    Switch1 --- TV_Gen2
    Switch1 --- TV_Gen3
    Switch1 --- TV_Gen4

    %% Estilização
    classDef box fill:#fff9c4,stroke:#d4e157,stroke-width:2px;
    classDef device fill:#e1bee7,stroke:#8e24aa,stroke-width:1px;
    
    class CE,Estar,SuiteMaster,Suite01,Suite02,Cozinha box;
    class Modem1,ModemWan,Router,RouterLink,Switch1,Switch2,SmartCenter,AP_TV,AP_Escrivaninha,TV_Gen1,TV_Gen2,TV_Gen3,TV_Gen4 device;`;

export const MermaidPrototypePage: React.FC = () => {
  const styles = useStyles();
  const [chartCode, setChartCode] = useState(DEFAULT_CHART);

  return (
    <>
      <PageHeader
        title="Protótipo Mermaid"
        subtitle="Teste de visualização e exportação de diagramas"
      />
      <PageContainer>
        <div className={styles.container}>
          <Card>
            <CardHeader
              image={<DeveloperBoard24Regular />}
              header={<Text weight="semibold">Editor de Diagrama</Text>}
              description={<Text size={200}>Edite o código Mermaid abaixo para atualizar o diagrama em tempo real</Text>}
            />
            
            <div style={{ padding: tokens.spacingHorizontalM, display: 'flex', flexDirection: 'column', gap: tokens.spacingVerticalM }}>
              <Textarea
                className={styles.textarea}
                value={chartCode}
                onChange={(e, data) => setChartCode(data.value)}
                resize="vertical"
              />
              
              <div style={{ borderTop: `1px solid ${tokens.colorNeutralStroke1}`, paddingTop: tokens.spacingVerticalM }}>
                <Text weight="semibold" style={{ marginBottom: tokens.spacingVerticalS, display: 'block' }}>
                  Visualização
                </Text>
                <MermaidDiagram chart={chartCode} />
              </div>
            </div>
          </Card>
        </div>
      </PageContainer>
    </>
  );
};
