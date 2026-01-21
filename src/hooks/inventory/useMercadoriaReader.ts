import { useCallback } from 'react';
import { Cr22fEstoqueFromSharepointListService, NewRegistrodeLeituradeMercadoriaemEstoqueService } from '../../generated';
import type { MercadoriaLida, ParsedBarcode } from '../../types';
import { splitBarcodeGroups } from '../../utils/inventory/barcodeParser';
import { parseEnderecoCodigo } from '../../utils/inventory/enderecoParser';
import { useCurrentSystemUser } from '../useCurrentSystemUser';

const buildOrFilter = (field: string, values: Array<string | number>) => {
  if (!values.length) return '';
  return values.map((value) => (typeof value === 'number' ? `${field} eq ${value}` : `${field} eq '${value}'`)).join(' or ');
};

const escapeOData = (value: string) => value.replace(/'/g, "''");

export const useMercadoriaReader = () => {
  const { systemUserId } = useCurrentSystemUser();

  const fetchMercadorias = useCallback(async (codes: ParsedBarcode[]) => {
    const { numericValues, textValues } = splitBarcodeGroups(codes);
    const escapedText = textValues.map(escapeOData);

    const numericFilter = buildOrFilter('cr22f_querytag', numericValues);
    const textFilter = buildOrFilter('cr22f_serialnumber', escapedText);
    const filter = [numericFilter, textFilter].filter(Boolean).map((group) => `(${group})`).join(' or ');

    if (!filter) {
      return [];
    }

    const result = await Cr22fEstoqueFromSharepointListService.getAll({
      filter,
      select: [
        'cr22f_estoquefromsharepointlistid',
        'cr22f_querytag',
        'cr22f_serialnumber',
        'new_referenciadoproduto',
        'new_quantidade',
        'cr22f_status',
        'new_endereco',
        'new_clientefx',
        'statecode',
        'new_tagconfirmadabool',
      ],
    });

    const data = (result.data ?? []) as Array<Record<string, any>>;
    return data.map<MercadoriaLida>((item) => ({
      id: item.cr22f_estoquefromsharepointlistid,
      etiqueta: item.cr22f_querytag ?? undefined,
      numeroSerie: item.cr22f_serialnumber ?? undefined,
      referencia: item.new_referenciadoproduto ?? undefined,
      quantidade: item.new_quantidade ?? undefined,
      situacao: item.cr22f_status ?? undefined,
      endereco: item.new_endereco ?? undefined,
      cliente: item.new_clientefx ?? undefined,
      status: item.statecode ?? 1,
      tagConfirmadaBool: item.new_tagconfirmadabool ?? false,
    }));
  }, []);

  const atualizarUltimaLeitura = useCallback(async (ids: string[]) => {
    const now = new Date().toISOString();
    await Promise.all(
      ids.map((id) =>
        Cr22fEstoqueFromSharepointListService.update(id, {
          new_datadaultimaleitura: now,
        })
      )
    );
  }, []);

  const registrarLeituras = useCallback(async (ids: string[], endereco?: string) => {
    if (!systemUserId) return;
    const now = new Date().toISOString();
    await Promise.all(
      ids.map((id) =>
        NewRegistrodeLeituradeMercadoriaemEstoqueService.create({
          'new_RegistradoPor@odata.bind': `/systemusers(${systemUserId})`,
          'new_Mercadoria@odata.bind': `/cr22f_estoquefromsharepointlists(${id})`,
          new_dataehora: now,
          new_endereco: endereco,
        })
      )
    );
  }, [systemUserId]);

  const ativarMercadorias = useCallback(async (items: MercadoriaLida[]) => {
    await Promise.all(
      items.map((item) =>
        Cr22fEstoqueFromSharepointListService.update(item.id, {
          statecode: 0,
          statuscode: 1,
          new_confirmacaodeetiqueta: item.leituraCodigo,
        })
      )
    );
  }, []);

  const atualizarNumeroSerie = useCallback(async (ids: string[], serial: string) => {
    await Promise.all(
      ids.map((id) =>
        Cr22fEstoqueFromSharepointListService.update(id, {
          cr22f_serialnumber: serial,
        })
      )
    );
  }, []);

  const atualizarEndereco = useCallback(async (ids: string[], endereco: string) => {
    const parsed = parseEnderecoCodigo(endereco);
    if (!parsed.valido || !parsed.endereco) {
      throw new Error(parsed.erro ?? 'Endereço inválido.');
    }
    const enderecoValido = parsed.endereco; // Garante que enderecoValido não é undefined
    const now = new Date().toISOString();
    await Promise.all(
      ids.map((id) =>
        Cr22fEstoqueFromSharepointListService.update(id, {
          new_centrodedistribuicao: enderecoValido.centroDistribuicao,
          new_deposito: enderecoValido.deposito,
          new_rua: enderecoValido.rua,
          new_estante: enderecoValido.estante,
          new_prateleira: enderecoValido.prateleira,
          new_endereco: parsed.codigo,
          new_datadaultimaleitura: now,
        })
      )
    );
  }, []);

  return {
    fetchMercadorias,
    atualizarUltimaLeitura,
    registrarLeituras,
    ativarMercadorias,
    atualizarNumeroSerie,
    atualizarEndereco,
  };
};
