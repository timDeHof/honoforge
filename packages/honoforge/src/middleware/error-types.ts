export interface ProblemDetails {
  type: string;
  title: string;
  status: number;
  detail: string;
  instance?: string;
  [key: string]: unknown;
}

export interface ProblemDetailsOptions {
  type?: string;
  title?: string;
  status: number;
  detail?: string;
  instance?: string;
  extensions?: Record<string, unknown>;
}
