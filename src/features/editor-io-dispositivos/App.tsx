import { useState } from 'react';
import { Button } from '@fluentui/react-components';
import { ArrowLeftRegular } from '@fluentui/react-icons';
import AppLayout from './components/layout/AppLayout';
import ManufacturerList from './components/manufacturers/ManufacturerList';
import ProductList from './components/products/ProductList';
import ConnectionEditor from './components/editor/ConnectionEditor';
import { EditorProvider } from './context/EditorProvider';
import type { Manufacturer, Product } from './types';

const EditorScreen: React.FC<{
  product: Product;
  manufacturerName: string;
  onBack: () => void;
  onBackToManufacturers: () => void;
}> = ({ product, manufacturerName, onBack, onBackToManufacturers }) => {
  const handleBack = () => {
    onBack();
  };

  const breadcrumbItems = [
    { label: 'Fabricantes', onClick: onBackToManufacturers },
    { label: manufacturerName, onClick: onBack },
    { label: product.cr22f_title },
  ];

  return (
    <AppLayout
      title={product.cr22f_title}
      breadcrumbItems={breadcrumbItems}
      actions={
        <Button appearance="subtle" icon={<ArrowLeftRegular />} onClick={handleBack}>
          Voltar
        </Button>
      }
    >
      <ConnectionEditor />
    </AppLayout>
  );
};

function App() {
  const [selectedManufacturer, setSelectedManufacturer] = useState<Manufacturer | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  const resetToManufacturers = () => {
    setSelectedManufacturer(null);
    setSelectedProduct(null);
  };

  const handleManufacturerSelect = (manufacturer: Manufacturer) => {
    setSelectedManufacturer(manufacturer);
    setSelectedProduct(null);
  };

  const handleProductSelect = (product: Product) => {
    setSelectedProduct(product);
  };

  if (!selectedManufacturer) {
    return (
      <AppLayout title="Fabricantes">
        <ManufacturerList onSelect={handleManufacturerSelect} />
      </AppLayout>
    );
  }

  if (!selectedProduct) {
    return (
      <AppLayout
        title={selectedManufacturer.cr22f_title}
        breadcrumbItems={[{ label: 'Fabricantes', onClick: resetToManufacturers }]}
        actions={
          <Button appearance="subtle" icon={<ArrowLeftRegular />} onClick={resetToManufacturers}>
            Voltar
          </Button>
        }
      >
        <ProductList
          manufacturerId={selectedManufacturer.cr22f_fabricantesfromsharpointlistid}
          onSelect={handleProductSelect}
        />
      </AppLayout>
    );
  }

  return (
    <EditorProvider product={selectedProduct}>
      <EditorScreen
        product={selectedProduct}
        manufacturerName={selectedManufacturer.cr22f_title}
        onBack={() => setSelectedProduct(null)}
        onBackToManufacturers={resetToManufacturers}
      />
    </EditorProvider>
  );
}

export default App;
