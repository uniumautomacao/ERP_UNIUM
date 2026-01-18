import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft24Regular, ArrowSync24Regular } from '@fluentui/react-icons';
import { CommandBar } from '../../components/layout/CommandBar';
import { PageContainer } from '../../components/layout/PageContainer';
import { PageHeader } from '../../components/layout/PageHeader';
import { DeviceIOEditorView } from '../../components/domain/device-io/DeviceIOEditorView';
import { DeviceIOManufacturersView } from '../../components/domain/device-io/DeviceIOManufacturersView';
import { DeviceIOProductsView } from '../../components/domain/device-io/DeviceIOProductsView';
import { useDeviceIOEditor } from '../../hooks/device-io/useDeviceIOEditor';
import { useDeviceIOManufacturers } from '../../hooks/device-io/useDeviceIOManufacturers';
import { useDeviceIOProducts } from '../../hooks/device-io/useDeviceIOProducts';
import type { DeviceIOManufacturer, DeviceIOProduct } from '../../types';

export function DispositivosIOPage() {
  const [selectedManufacturer, setSelectedManufacturer] = useState<DeviceIOManufacturer | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<DeviceIOProduct | null>(null);
  const [manufacturerSearch, setManufacturerSearch] = useState('');
  const [productSearch, setProductSearch] = useState('');
  const [debouncedManufacturerSearch, setDebouncedManufacturerSearch] = useState('');
  const [debouncedProductSearch, setDebouncedProductSearch] = useState('');

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedManufacturerSearch(manufacturerSearch), 300);
    return () => window.clearTimeout(timer);
  }, [manufacturerSearch]);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedProductSearch(productSearch), 300);
    return () => window.clearTimeout(timer);
  }, [productSearch]);

  const {
    manufacturers,
    loading: manufacturersLoading,
    error: manufacturersError,
    reload: reloadManufacturers,
  } = useDeviceIOManufacturers(debouncedManufacturerSearch);

  const {
    products,
    loading: productsLoading,
    error: productsError,
    reload: reloadProducts,
  } = useDeviceIOProducts(
    selectedManufacturer?.cr22f_fabricantesfromsharpointlistid ?? null,
    debouncedProductSearch
  );

  const editor = useDeviceIOEditor(selectedProduct);

  useEffect(() => {
    if (!selectedProduct) {
      return;
    }
    const updated = products.find(
      (item) =>
        item.cr22f_modelosdeprodutofromsharepointlistid ===
        selectedProduct.cr22f_modelosdeprodutofromsharepointlistid
    );
    if (updated) {
      setSelectedProduct(updated);
    }
  }, [products, selectedProduct]);

  const view = selectedManufacturer
    ? selectedProduct
      ? 'editor'
      : 'products'
    : 'manufacturers';

  const primaryActions = useMemo(() => {
    if (view === 'manufacturers') {
      return [
        {
          id: 'refresh-manufacturers',
          label: 'Atualizar',
          icon: <ArrowSync24Regular />,
          onClick: reloadManufacturers,
        },
      ];
    }

    if (view === 'products') {
      return [
        {
          id: 'refresh-products',
          label: 'Atualizar',
          icon: <ArrowSync24Regular />,
          onClick: reloadProducts,
        },
      ];
    }

    return [
      {
        id: 'refresh-editor',
        label: 'Atualizar',
        icon: <ArrowSync24Regular />,
        onClick: reloadProducts,
      },
    ];
  }, [reloadManufacturers, reloadProducts, view]);

  const secondaryActions = useMemo(() => {
    if (view === 'products') {
      return [
        {
          id: 'back-to-manufacturers',
          label: 'Voltar',
          icon: <ArrowLeft24Regular />,
          onClick: () => {
            setSelectedManufacturer(null);
            setSelectedProduct(null);
            setProductSearch('');
          },
        },
      ];
    }

    if (view === 'editor') {
      return [
        {
          id: 'back-to-products',
          label: 'Voltar',
          icon: <ArrowLeft24Regular />,
          onClick: () => {
            setSelectedProduct(null);
          },
        },
      ];
    }

    return [];
  }, [view]);

  const headerTitle = 'Dispositivos IO';
  const headerSubtitle = view === 'manufacturers'
    ? 'Fabricantes'
    : view === 'products'
      ? `Produtos • ${selectedManufacturer?.cr22f_title ?? ''}`
      : `Editor • ${selectedProduct?.cr22f_title ?? ''}`;

  return (
    <>
      <CommandBar primaryActions={primaryActions} secondaryActions={secondaryActions} />
      <PageHeader title={headerTitle} subtitle={headerSubtitle} />
      <PageContainer>
        {view === 'manufacturers' && (
          <DeviceIOManufacturersView
            manufacturers={manufacturers}
            loading={manufacturersLoading}
            error={manufacturersError}
            searchValue={manufacturerSearch}
            onSearchChange={setManufacturerSearch}
            onReload={reloadManufacturers}
            onSelect={(manufacturer) => {
              setSelectedManufacturer(manufacturer);
              setSelectedProduct(null);
              setProductSearch('');
            }}
          />
        )}

        {view === 'products' && selectedManufacturer && (
          <DeviceIOProductsView
            products={products}
            loading={productsLoading}
            error={productsError}
            searchValue={productSearch}
            onSearchChange={setProductSearch}
            onReload={reloadProducts}
            onSelect={(product) => setSelectedProduct(product)}
          />
        )}

        {view === 'editor' && selectedManufacturer && selectedProduct && (
          <DeviceIOEditorView
            product={selectedProduct}
            manufacturerName={selectedManufacturer.cr22f_title}
            editor={editor}
            onRefresh={reloadProducts}
          />
        )}
      </PageContainer>
    </>
  );
}
