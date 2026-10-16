import { LitElement, TemplateResult } from 'lit';
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
import type { ValidationIssue } from '@openenergytools/ocl-validator';
import { Issue } from '@openenergytools/xml-schema-validator';
/** An editor [[`plugin`]] to configure validators and display their issue centrally */
export default class SclValidatingPlugin extends LitElement {
    /** The document being edited as provided to plugins by [[`OpenSCD`]]. */
    doc?: XMLDocument;
    /** The name of the document being edited */
    _docName: string;
    set docName(docName: string);
    get docName(): string;
    /** SCL change indicator */
    set editCount(count: number);
    /** Issues return by the schema validator */
    schemaIssues: Issue[];
    /** Issues returned by the template validator */
    templateIssues: Issue[];
    /** Issues returned by the OCL validator */
    oclIssues: ValidationIssue[];
    /** Whether schema validator has had the initial run */
    waitForSchemaRun: boolean;
    /** Whether template validator has had the initial run */
    waitForTemplateRun: boolean;
    /** Whether OCL validator has had the initial run */
    waitForOCLRun: boolean;
    /** Whether schema validator shall run after each change to the doc */
    autoValidateSchema: boolean;
    /** Whether template validator shall run after each change to the doc */
    autoValidateTemplate: boolean;
    /** Whether OCL validator shall run after each change to the doc */
    autoValidateOCL: boolean;
    dialog: Dialog;
    expandTemplate: IconButtonToggle;
    expandSchema: IconButtonToggle;
    manualTriggerTemplateValidator: Button;
    manualTriggerSchemaValidator: Button;
    alertSchemaIssue: Snackbar;
    alertTemplateIssue: Snackbar;
    toggleAutoValidateSchema: Snackbar;
    toggleAutoValidateTemplate: Snackbar;
    expandOCL: IconButtonToggle;
    manualTriggerOCLValidator: Button;
    alertOCLIssue: Snackbar;
    toggleAutoValidateOCL: Snackbar;
    run(): Promise<void>;
    private validateSchema;
    private validateTemplates;
    private validateOCL;
    private autoValidate;
    private resetValidation;
    private renderValidatorsIssues;
    private getSeverityColor;
    private getSeverityIcon;
    private renderOCLIssues;
    private renderTemplateValidator;
    private renderOCLValidator;
    private renderSchemaValidator;
    render(): TemplateResult;
    static styles: import("lit").CSSResult;
}
