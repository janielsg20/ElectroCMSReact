import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { App } from './App';

describe('App foundation', () => {
  it('renders the ElectroCMS identity and local-first baseline', () => {
    render(<App />);

    expect(screen.getByRole('heading', { name: 'ElectroCMS' })).toBeInTheDocument();
    expect(screen.getByText('Local-first', { selector: 'dd' })).toBeInTheDocument();
  });
});
