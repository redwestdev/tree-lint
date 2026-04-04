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
}
