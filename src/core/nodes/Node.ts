export class Node {
  public isValid: boolean = true;
  public errors: string[] = [];
  public warnings: string[] = [];
  public name: string;
  public path: string;

  constructor(name: string, path: string) {
    this.name = name;
    this.path = path;
  }

  addWarning(warn: string) {
    this.warnings.push(warn);
  }

  addError(err: string) {
    this.errors.push(err);
  }

  setValidity(valid: boolean) {
    this.isValid = valid;
  }
}
