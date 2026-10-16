/* eslint-disable import/no-extraneous-dependencies */
import { LitElement, TemplateResult, css, html } from 'lit';
import { property, query, state } from 'lit/decorators.js';

import '@material/mwc-button';
import '@material/mwc-dialog';
import '@material/mwc-formfield';
import '@material/mwc-icon';
import '@material/mwc-icon-button-toggle';
import '@material/mwc-list';
import '@material/mwc-snackbar';
import '@material/mwc-switch';
import type { Button } from '@material/mwc-button';
import type { Dialog } from '@material/mwc-dialog';
import type { IconButtonToggle } from '@material/mwc-icon-button-toggle';
import type { Snackbar } from '@material/mwc-snackbar';

import { validate as validateOCL } from '@openenergytools/ocl-validator';
import type { ValidationIssue } from '@openenergytools/ocl-validator';
import { validate } from '@openenergytools/scl-template-validator';
import { Issue } from '@openenergytools/xml-schema-validator';
import { identity } from '@openscd/scl-lib';
import { validateSchema } from './schema/validateSchema.js';

/** An editor [[`plugin`]] to configure validators and display their issue centrally */
export default class SclValidatingPlugin extends LitElement {
  /** The document being edited as provided to plugins by [[`OpenSCD`]]. */
  @property({ attribute: false })
  doc?: XMLDocument;

  /** The name of the document being edited */
  _docName = '';

  @property()
  set docName(docName: string) {
    if (docName === '') return;

    this.resetValidation();
    this.autoValidate();
  }

  get docName(): string {
    return this._docName;
  }

  /** SCL change indicator */
  @property({ type: Number })
  set editCount(count: number) {
    if (this.doc) this.autoValidate();
  }

  /** Issues return by the schema validator */
  @state() schemaIssues: Issue[] = [];

  /** Issues returned by the template validator */
  @state() templateIssues: Issue[] = [];

  /** Issues returned by the OCL validator */
  @state() oclIssues: ValidationIssue[] = [];

  /** Whether schema validator has had the initial run */
  @state() waitForSchemaRun = true;

  /** Whether template validator has had the initial run */
  @state() waitForTemplateRun = true;

  /** Whether OCL validator has had the initial run */
  @state() waitForOCLRun = true;

  /** Whether schema validator shall run after each change to the doc */
  @state() autoValidateSchema = false;

  /** Whether template validator shall run after each change to the doc */
  @state() autoValidateTemplate = false;

  /** Whether OCL validator shall run after each change to the doc */
  @state() autoValidateOCL = false;

  @query('.content.dialog') dialog!: Dialog;

  @query('.expand.template') expandTemplate!: IconButtonToggle;

  @query('.expand.schema') expandSchema!: IconButtonToggle;

  @query('.run.template') manualTriggerTemplateValidator!: Button;

  @query('.run.schema') manualTriggerSchemaValidator!: Button;

  @query('.alert.schema') alertSchemaIssue!: Snackbar;

  @query('.alert.template') alertTemplateIssue!: Snackbar;

  @query('.auto.schema') toggleAutoValidateSchema!: Snackbar;

  @query('.auto.template') toggleAutoValidateTemplate!: Snackbar;

  @query('.expand.ocl') expandOCL!: IconButtonToggle;

  @query('.run.ocl') manualTriggerOCLValidator!: Button;

  @query('.alert.ocl') alertOCLIssue!: Snackbar;

  @query('.auto.ocl') toggleAutoValidateOCL!: Snackbar;

  async run() {
    this.dialog.show();
  }

  private async validateSchema(): Promise<void> {
    this.schemaIssues.length = 0;
    await this.requestUpdate('schemaIssues');

    const result = await validateSchema(this.doc!, this.docName);
    this.schemaIssues = result || [{ title: 'Invalid Schema!' }];
    this.waitForSchemaRun = false;

    if (this.schemaIssues.length) {
      this.alertSchemaIssue.labelText =
        this.schemaIssues[this.schemaIssues.length - 1].title;
      this.alertSchemaIssue.show();
    }

    this.requestUpdate('schemaIssues');
  }

  private async validateTemplates(): Promise<void> {
    this.templateIssues.length = 0;
    this.waitForTemplateRun = false;

    for await (const issue of validate(this.doc!)) {
      this.templateIssues.push(...issue);
      this.requestUpdate('templateIssues');
    }

    if (this.templateIssues.length) {
      this.alertTemplateIssue.labelText =
        this.templateIssues[this.templateIssues.length - 1].title;
      this.alertTemplateIssue.show();
    }

    this.requestUpdate('templateIssues');
  }

  private async validateOCL(): Promise<void> {
    this.oclIssues.length = 0;
    this.waitForOCLRun = false;

    for await (const issues of validateOCL(this.doc!, {
      filename: this.docName,
    })) {
      this.oclIssues.push(...issues);
      this.requestUpdate('oclIssues');
    }

    if (this.oclIssues.length) {
      const lastIssue = this.oclIssues[this.oclIssues.length - 1];
      const identityString = lastIssue.element
        ? identity(lastIssue.element)
        : 'N/A';
      this.alertOCLIssue.labelText = `[${lastIssue.severity}] ${lastIssue.id}: ${lastIssue.message} (${identityString})`;
      this.alertOCLIssue.show();
    }

    this.requestUpdate('oclIssues');
  }

  private async autoValidate(): Promise<void> {
    if (this.autoValidateTemplate) this.validateTemplates();
    if (this.autoValidateSchema) this.validateSchema();
    if (this.autoValidateOCL) this.validateOCL();
  }

  private async resetValidation(): Promise<void> {
    this.schemaIssues.length = 0;
    this.templateIssues.length = 0;
    this.oclIssues.length = 0;

    this.waitForSchemaRun = true;
    this.waitForTemplateRun = true;
    this.waitForOCLRun = true;
  }

  // eslint-disable-next-line class-methods-use-this
  private renderValidatorsIssues(issues: Issue[]): TemplateResult[] {
    if (issues.length === 0)
      return [html`<li divider padded role="separator"></li>`];
    return [
      html`<li divider padded role="separator"></li>`,
      ...issues.map(
        issue => html` <abbr title="${`${issue.title}\n${issue.message}`}"
          ><mwc-list-item ?twoline=${!!issue.message}>
            <span> ${issue.title}</span>
            <span slot="secondary">${issue.message}</span>
          </mwc-list-item></abbr
        >`
      ),
    ];
  }

  // eslint-disable-next-line class-methods-use-this
  private getSeverityColor(severity: string): string {
    switch (severity) {
      case 'ERROR':
        return '#d32f2f';
      case 'WARNING':
        return '#f57c00';
      default:
        return '#1976d2';
    }
  }

  // eslint-disable-next-line class-methods-use-this
  private getSeverityIcon(severity: string): string {
    switch (severity) {
      case 'ERROR':
        return 'error';
      case 'WARNING':
        return 'warning';
      default:
        return 'info';
    }
  }

  // eslint-disable-next-line class-methods-use-this
  private renderOCLIssues(issues: ValidationIssue[]): TemplateResult[] {
    if (issues.length === 0)
      return [html`<li divider padded role="separator"></li>`];
    return [
      html`<li divider padded role="separator"></li>`,
      ...issues.map(issue => {
        const severityColor = this.getSeverityColor(issue.severity);
        const severityIcon = this.getSeverityIcon(issue.severity);
        const identityString = issue.element ? identity(issue.element) : 'N/A';
        return html` <abbr
          title="${`[${issue.severity}] ${issue.id}\n${issue.message}\nElement: ${identityString}`}"
        >
          <mwc-list-item ?twoline=${!!issue.message} graphic="avatar">
            <mwc-icon
              slot="graphic"
              style="color: ${severityColor}; background: ${severityColor}22; border-radius: 50%; padding: 4px;"
              >${severityIcon}</mwc-icon
            >
            <span>
              <span
                style="color: ${severityColor}; font-weight: bold; margin-right: 8px;"
                >[${issue.severity}]</span
              >
              ${issue.id}
            </span>
            <span slot="secondary">
              ${issue.message}
              <span
                style="display: block; font-size: 0.85em; color: #666; font-family: monospace; margin-top: 4px;"
                >📍 ${identityString}</span
              >
            </span>
          </mwc-list-item></abbr
        >`;
      }),
    ];
  }

  private renderTemplateValidator(): TemplateResult {
    return html`<div style="display: flex; flex-direction: row">
        <div style="display: flex; flex-direction: column; flex: auto;">
          <div style="display: flex; flex-direction: row">
            <h3 style="flex:auto">
              ${`Template issues (${
                this.waitForTemplateRun
                  ? 'Run template validator'
                  : this.templateIssues.length
              })`}
            </h3>
            <mwc-icon-button-toggle
              class="expand template"
              onIcon="expand_less"
              offIcon="expand_more"
              @click="${() => this.requestUpdate()}"
            ></mwc-icon-button-toggle>
          </div>
          <div style="display: flex; flex-direction: row">
            <div style="display:flex; align-items:center; flex:auto">
              <mwc-button
                class="run template"
                style="float: right"
                label="${`${
                  this.waitForTemplateRun ? '' : 'Re-'
                }Run manual validation`}"
                @click="${this.validateTemplates}"
              ></mwc-button>
            </div>
            <div style="display: flex">
              <mwc-formfield label="Auto validate on change" alignEnd>
                <mwc-switch
                  class="auto template"
                  @click="${() => {
                    this.autoValidateTemplate = !this.autoValidateTemplate;
                  }}"
                ></mwc-switch>
              </mwc-formfield>
            </div>
          </div>
        </div>
      </div>
      ${this.expandTemplate && this.expandTemplate.on
        ? html`<mwc-list>
            <li divider padded role="separator"></li>
          </mwc-list>`
        : html`<mwc-list id="content" wrapFocus
            >${this.renderValidatorsIssues(this.templateIssues)}</mwc-list
          >`}`;
  }

  private renderOCLValidator(): TemplateResult {
    return html`<div style="display: flex; flex-direction: row">
        <div style="display: flex; flex-direction: column; flex: auto;">
          <div style="display: flex; flex-direction: row">
            <h3 style="flex:auto">
              ${`OCL issues (${
                this.waitForOCLRun ? 'Run OCL validator' : this.oclIssues.length
              })`}
            </h3>
            <mwc-icon-button-toggle
              class="expand ocl"
              onIcon="expand_less"
              offIcon="expand_more"
              @click="${() => this.requestUpdate()}"
            ></mwc-icon-button-toggle>
          </div>
          <div style="display: flex; flex-direction: row">
            <div style="display:flex; align-items:center; flex:auto">
              <mwc-button
                class="run ocl"
                style="float: right"
                label="${`${
                  this.waitForOCLRun ? '' : 'Re-'
                }Run OCL validation`}"
                @click="${this.validateOCL}"
              ></mwc-button>
            </div>
            <div style="display: flex">
              <mwc-formfield label="Auto validate on change" alignEnd>
                <mwc-switch
                  class="auto ocl"
                  @click="${() => {
                    this.autoValidateOCL = !this.autoValidateOCL;
                  }}"
                ></mwc-switch>
              </mwc-formfield>
            </div>
          </div>
        </div>
      </div>
      ${this.expandOCL && this.expandOCL.on
        ? html`<mwc-list>
            <li divider padded role="separator"></li>
          </mwc-list>`
        : html`<mwc-list id="content" wrapFocus
            >${this.renderOCLIssues(this.oclIssues)}</mwc-list
          >`}`;
  }

  private renderSchemaValidator(): TemplateResult {
    return html`<div style="display: flex; flex-direction: row">
        <div style="display: flex; flex-direction: column; flex: auto;">
          <div style="display: flex; flex-direction: row">
            <h3 style="flex:auto">
              ${`Schema issues (${
                this.waitForSchemaRun
                  ? 'Run schema validator'
                  : this.schemaIssues.length
              })`}
            </h3>
            <mwc-icon-button-toggle
              class="expand schema"
              onIcon="expand_less"
              offIcon="expand_more"
              @click="${() => this.requestUpdate()}"
            ></mwc-icon-button-toggle>
          </div>
          <div style="display: flex; flex-direction: row">
            <div style="display:flex; align-items:center; flex:auto">
              <mwc-button
                class="run schema"
                style="float: right"
                label="${`${
                  this.waitForSchemaRun ? '' : 'Re-'
                }Run manual validation`}"
                @click="${this.validateSchema}"
              ></mwc-button>
            </div>
            <div style="display: flex">
              <mwc-formfield label="Auto validate on change" alignEnd>
                <mwc-switch
                  class="auto schema"
                  @click="${() => {
                    this.autoValidateSchema = !this.autoValidateSchema;
                  }}"
                ></mwc-switch>
              </mwc-formfield>
            </div>
          </div>
        </div>
      </div>
      ${this.expandSchema && this.expandSchema.on
        ? html`<mwc-list>
            <li divider padded role="separator"></li>
          </mwc-list>`
        : html`<mwc-list id="content" wrapFocus
            >${this.renderValidatorsIssues(this.schemaIssues)}</mwc-list
          >`}`;
  }

  render(): TemplateResult {
    if (!this.doc)
      return html`<mwc-dialog class="content dialog"
        ><div>No SCL file loaded, yet!</div>
        <mwc-button
          label="Cancel"
          slot="secondaryAction"
          dialogAction="close"
        ></mwc-button>
      </mwc-dialog>`;

    return html`<mwc-dialog class="content dialog">
        ${this.renderSchemaValidator()}${this.renderTemplateValidator()}${this.renderOCLValidator()}
        <mwc-button
          label="Cancel"
          slot="secondaryAction"
          dialogAction="close"
        ></mwc-button>
      </mwc-dialog>
      <mwc-snackbar class="alert schema" .timeoutMs=${5000}>
        <mwc-button slot="action" @click=${() => this.dialog.show()}
          >DETAIL</mwc-button
        > </mwc-snackbar
      ><mwc-snackbar class="alert template" .timeoutMs=${4000}>
        <mwc-button slot="action" @click=${() => this.dialog.show()}
          >DETAIL</mwc-button
        > </mwc-snackbar
      ><mwc-snackbar class="alert ocl" .timeoutMs=${6000}>
        <mwc-button slot="action" @click=${() => this.dialog.show()}
          >DETAIL</mwc-button
        >
      </mwc-snackbar>`;
  }

  static styles = css`
    mwc-dialog {
      --mdc-dialog-max-width: 90vw;
      --mdc-dialog-min-width: 50vw;
    }

    abbr {
      text-decoration: none;
      border-bottom: none;
    }
  `;
}
