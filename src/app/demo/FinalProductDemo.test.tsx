import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { FinalProductDemo } from './FinalProductDemo';

describe('FinalProductDemo', () => {
  it('presents the professional builder anatomy and navigates visual product modules', async () => {
    const user = userEvent.setup();
    render(<FinalProductDemo workspaceId="editor" />);

    expect(screen.getByTestId('final-product-demo')).toBeInTheDocument();
    expect(screen.getByText('Final Product Demo')).toBeInTheDocument();
    expect(screen.getByRole('complementary', { name: 'Insert library' })).toBeInTheDocument();
    expect(screen.getByRole('complementary', { name: 'Contextual inspector' })).toBeInTheDocument();
    expect(screen.getByLabelText('Storefront page canvas')).toBeInTheDocument();

    const moduleNavigation = screen.getByRole('navigation', { name: 'ElectroCMS Studio modules' });

    await user.click(within(moduleNavigation).getByRole('button', { name: 'Content' }));
    expect(screen.getByRole('heading', { name: 'Dynamic Content' })).toBeInTheDocument();
    expect(screen.getByText('Products', { selector: 'strong' })).toBeInTheDocument();

    await user.click(within(moduleNavigation).getByRole('button', { name: 'Queries' }));
    expect(screen.getByRole('heading', { name: 'Query Studio' })).toBeInTheDocument();

    await user.click(within(moduleNavigation).getByRole('button', { name: 'Blueprints' }));
    expect(screen.getByRole('heading', { name: 'Project Blueprints' })).toBeInTheDocument();
    expect(screen.getByText('Tattoo Studio')).toBeInTheDocument();
  });

  it('maps Preview and Export workspaces to final-product presentation surfaces', () => {
    const { rerender } = render(<FinalProductDemo workspaceId="preview" />);
    expect(screen.getByText('Live Preview')).toBeInTheDocument();
    expect(screen.getByText('Objects for a quieter everyday.')).toBeInTheDocument();

    rerender(<FinalProductDemo workspaceId="export" />);
    expect(screen.getByRole('heading', { name: 'Build & Export' })).toBeInTheDocument();
    expect(screen.getByText('WordPress')).toBeInTheDocument();
    expect(screen.getByText('LAMP')).toBeInTheDocument();
  });
});
