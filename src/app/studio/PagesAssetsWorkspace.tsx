import { useMemo, useState } from 'react';
import type { CanonicalDocument, DocumentKind, MediaAssetRef } from '../../core/project';
import { Icon, type IconName } from '../components/Icon';
import { useProjectSession } from '../project/project-session-context';
import { CapabilityStatus } from './CapabilityStatus';

type PagesView = 'pages' | 'templates' | 'assets';
type Density = 'table' | 'grid';

const templateKinds = new Set<DocumentKind>(['template', 'header', 'footer', 'single', 'archive', '404']);

function documentKindLabel(kind: DocumentKind) {
  const labels: Record<DocumentKind, string> = {
    page: 'Page',
    template: 'Template',
    header: 'Header',
    footer: 'Footer',
    single: 'Single',
    archive: 'Archive',
    '404': '404',
    backend: 'Backend',
  };
  return labels[kind];
}

function documentIcon(kind: DocumentKind): IconName {
  if (kind === 'page') return 'pages';
  if (kind === 'header' || kind === 'footer') return 'blocks';
  return 'layers';
}

function mediaIcon(asset: MediaAssetRef): IconName {
  if (asset.mediaType.startsWith('image/')) return 'image';
  return 'media';
}

function DocumentRow({ document, active, onOpen }: { document: CanonicalDocument; active: boolean; onOpen(): void }) {
  return (
    <button
      type="button"
      className="group grid min-h-11 w-full grid-cols-[minmax(190px,1.3fr)_100px_minmax(120px,.8fr)_72px] items-center gap-3 border-b border-[var(--color-ec-border)] px-3 text-left transition-colors hover:bg-[var(--color-ec-surface-subtle)] focus-visible:outline-none focus-visible:shadow-[var(--ec-focus-ring)] data-[active=true]:bg-[var(--color-ec-accent-soft)]"
      data-active={active ? 'true' : 'false'}
      onClick={onOpen}
    >
      <span className="flex min-w-0 items-center gap-2.5">
        <span className="grid size-7 shrink-0 place-items-center rounded-[var(--ec-radius-sm)] border border-[var(--color-ec-border)] bg-[var(--color-ec-surface)] text-[var(--color-ec-text-muted)] group-data-[active=true]:border-transparent group-data-[active=true]:bg-[var(--color-ec-accent)] group-data-[active=true]:text-white"><Icon name={documentIcon(document.kind)} size={13} /></span>
        <span className="min-w-0"><strong className="block truncate text-[10px] font-semibold text-[var(--color-ec-text)]">{document.name}</strong><small className="block truncate text-[8px] text-[var(--color-ec-text-muted)]">/{document.slug ?? document.id}</small></span>
      </span>
      <span className="text-[9px] font-medium text-[var(--color-ec-text-muted)]">{documentKindLabel(document.kind)}</span>
      <span className="truncate text-[9px] text-[var(--color-ec-text-muted)]">{Object.keys(document.nodes).length} nodes</span>
      <span className="justify-self-end text-[8px] font-semibold uppercase tracking-[.08em] text-[var(--color-ec-accent)]">Open</span>
    </button>
  );
}

function DocumentCard({ document, active, onOpen }: { document: CanonicalDocument; active: boolean; onOpen(): void }) {
  return (
    <button
      type="button"
      className="group min-h-36 rounded-[var(--ec-radius-lg)] border border-[var(--color-ec-border)] bg-[var(--color-ec-surface)] p-3 text-left shadow-[var(--ec-shadow-panel)] transition hover:-translate-y-px hover:border-[var(--color-ec-accent)] focus-visible:outline-none focus-visible:shadow-[var(--ec-focus-ring)] data-[active=true]:border-[var(--color-ec-accent)]"
      data-active={active ? 'true' : 'false'}
      onClick={onOpen}
    >
      <span className="flex items-start justify-between"><span className="grid size-9 place-items-center rounded-[var(--ec-radius-md)] bg-[var(--color-ec-surface-muted)] text-[var(--color-ec-text-muted)] group-data-[active=true]:bg-[var(--color-ec-accent-soft)] group-data-[active=true]:text-[var(--color-ec-accent)]"><Icon name={documentIcon(document.kind)} size={16} /></span><span className="text-[8px] font-semibold uppercase tracking-[.1em] text-[var(--color-ec-text-muted)]">{documentKindLabel(document.kind)}</span></span>
      <strong className="mt-7 block truncate text-[11px] font-semibold text-[var(--color-ec-text)]">{document.name}</strong>
      <span className="mt-1 block truncate text-[8px] text-[var(--color-ec-text-muted)]">/{document.slug ?? document.id} · {Object.keys(document.nodes).length} nodes</span>
    </button>
  );
}

function MediaCard({ asset }: { asset: MediaAssetRef }) {
  const size = asset.byteSize < 1024 * 1024 ? `${Math.max(1, Math.round(asset.byteSize / 1024))} KB` : `${(asset.byteSize / (1024 * 1024)).toFixed(1)} MB`;
  return (
    <article className="overflow-hidden rounded-[var(--ec-radius-lg)] border border-[var(--color-ec-border)] bg-[var(--color-ec-surface)] shadow-[var(--ec-shadow-panel)]">
      <div className="grid aspect-[4/3] place-items-center border-b border-[var(--color-ec-border)] bg-[var(--color-ec-surface-subtle)] text-[var(--color-ec-text-muted)]"><Icon name={mediaIcon(asset)} size={28} /></div>
      <div className="p-3"><strong className="block truncate text-[10px] font-semibold text-[var(--color-ec-text)]">{asset.fileName}</strong><span className="mt-1 block text-[8px] text-[var(--color-ec-text-muted)]">{asset.mediaType} · {size}</span>{asset.altText ? <p className="mt-2 line-clamp-2 text-[8px] leading-4 text-[var(--color-ec-text-muted)]">{asset.altText}</p> : null}</div>
    </article>
  );
}

export function PagesAssetsWorkspace({ initialView = 'pages', onOpenBuilder }: { initialView?: PagesView; onOpenBuilder(): void }) {
  const session = useProjectSession();
  const [view, setView] = useState<PagesView>(initialView);
  const [density, setDensity] = useState<Density>('table');
  const [query, setQuery] = useState('');
  const documents = useMemo(() => session.project.documentOrder.flatMap((id) => session.project.documents[id] ? [session.project.documents[id]] : []), [session.project.documentOrder, session.project.documents]);
  const pages = documents.filter((document) => document.kind === 'page');
  const templates = documents.filter((document) => templateKinds.has(document.kind));
  const assets = Object.values(session.project.media);
  const normalizedQuery = query.trim().toLowerCase();
  const visibleDocuments = (view === 'templates' ? templates : pages).filter((document) => !normalizedQuery || `${document.name} ${document.slug ?? ''} ${document.kind}`.toLowerCase().includes(normalizedQuery));
  const visibleAssets = assets.filter((asset) => !normalizedQuery || `${asset.fileName} ${asset.mediaType} ${asset.altText ?? ''} ${asset.tags.join(' ')}`.toLowerCase().includes(normalizedQuery));

  const openDocument = (document: CanonicalDocument) => {
    session.setActiveDocumentId(document.id);
    onOpenBuilder();
  };

  return (
    <section className="flex min-h-0 flex-1 flex-col overflow-hidden bg-[var(--color-ec-app)]" aria-label="Pages and assets workspace">
      <header className="shrink-0 border-b border-[var(--color-ec-border)] bg-[var(--color-ec-surface)] px-4 py-3 md:px-5">
        <div className="mx-auto flex max-w-[1440px] flex-wrap items-end justify-between gap-3">
          <div><span className="text-[8px] font-bold uppercase tracking-[.16em] text-[var(--color-ec-accent)]">Project structure</span><h2 className="mt-1 text-[18px] font-semibold tracking-[-.03em] text-[var(--color-ec-text)]">Pages, templates & assets</h2><p className="mt-1 text-[9px] text-[var(--color-ec-text-muted)]">Manage the canonical documents and media already stored in this project.</p></div>
          <div className="flex items-center gap-1"><CapabilityStatus label="Read-only manager" detail="Project-level create/delete commands are not implemented yet; existing canonical resources remain fully navigable." /><button type="button" className="ec-control ec-focus-ring grid size-8 place-items-center text-[var(--color-ec-text-muted)]" aria-label="Table view" aria-pressed={density === 'table'} onClick={() => setDensity('table')}><Icon name="list" size={13} /></button><button type="button" className="ec-control ec-focus-ring grid size-8 place-items-center text-[var(--color-ec-text-muted)]" aria-label="Grid view" aria-pressed={density === 'grid'} onClick={() => setDensity('grid')}><Icon name="grid" size={13} /></button></div>
        </div>
      </header>

      <div className="mx-auto flex min-h-0 w-full max-w-[1440px] flex-1 flex-col p-3 md:p-4">
        <div className="flex shrink-0 flex-wrap items-center gap-2 border-b border-[var(--color-ec-border)] pb-3">
          <div className="flex rounded-[var(--ec-radius-md)] bg-[var(--color-ec-surface-muted)] p-0.5" role="tablist" aria-label="Project resources">
            {(['pages', 'templates', 'assets'] as const).map((item) => <button key={item} type="button" role="tab" aria-selected={view === item} className="h-7 rounded-[var(--ec-radius-sm)] px-3 text-[9px] font-semibold capitalize text-[var(--color-ec-text-muted)] data-[active=true]:bg-[var(--color-ec-surface)] data-[active=true]:text-[var(--color-ec-text)] data-[active=true]:shadow-sm" data-active={view === item ? 'true' : 'false'} onClick={() => setView(item)}>{item}<span className="ml-1.5 text-[8px] opacity-60">{item === 'pages' ? pages.length : item === 'templates' ? templates.length : assets.length}</span></button>)}
          </div>
          <label className="ml-auto flex h-8 min-w-[210px] flex-1 items-center gap-2 rounded-[var(--ec-radius-md)] border border-[var(--color-ec-border)] bg-[var(--color-ec-surface)] px-2.5 text-[var(--color-ec-text-muted)] sm:max-w-[320px]"><Icon name="search" size={12} /><input className="min-w-0 flex-1 bg-transparent text-[9px] text-[var(--color-ec-text)] outline-none placeholder:text-[var(--color-ec-text-muted)]" aria-label="Search project resources" placeholder={`Search ${view}…`} value={query} onChange={(event) => setQuery(event.target.value)} /></label>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto pt-3">
          {view !== 'assets' ? (
            visibleDocuments.length > 0 ? density === 'table' ? (
              <div className="overflow-hidden rounded-[var(--ec-radius-lg)] border border-[var(--color-ec-border)] bg-[var(--color-ec-surface)] shadow-[var(--ec-shadow-panel)]">
                <div className="grid h-8 grid-cols-[minmax(190px,1.3fr)_100px_minmax(120px,.8fr)_72px] items-center gap-3 border-b border-[var(--color-ec-border)] bg-[var(--color-ec-surface-subtle)] px-3 text-[7px] font-bold uppercase tracking-[.12em] text-[var(--color-ec-text-muted)]"><span>Name</span><span>Type</span><span>Structure</span><span className="text-right">Action</span></div>
                {visibleDocuments.map((document) => <DocumentRow key={document.id} document={document} active={session.activeDocumentId === document.id} onOpen={() => openDocument(document)} />)}
              </div>
            ) : <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">{visibleDocuments.map((document) => <DocumentCard key={document.id} document={document} active={session.activeDocumentId === document.id} onOpen={() => openDocument(document)} />)}</div> : <div className="grid min-h-64 place-items-center rounded-[var(--ec-radius-lg)] border border-dashed border-[var(--color-ec-border)] bg-[var(--color-ec-surface-subtle)] text-center"><div><Icon name={view === 'pages' ? 'pages' : 'layers'} size={24} /><strong className="mt-3 block text-[10px] text-[var(--color-ec-text)]">No {view} found</strong><span className="mt-1 block text-[8px] text-[var(--color-ec-text-muted)]">The project currently has no matching canonical documents.</span></div></div>
          ) : visibleAssets.length > 0 ? <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">{visibleAssets.map((asset) => <MediaCard key={asset.id} asset={asset} />)}</div> : <div className="grid min-h-64 place-items-center rounded-[var(--ec-radius-lg)] border border-dashed border-[var(--color-ec-border)] bg-[var(--color-ec-surface-subtle)] text-center"><div><Icon name="media" size={24} /><strong className="mt-3 block text-[10px] text-[var(--color-ec-text)]">No assets found</strong><span className="mt-1 block text-[8px] text-[var(--color-ec-text-muted)]">Media will appear here when it exists in the canonical project.</span></div></div>}
        </div>
      </div>
    </section>
  );
}
