import {Value} from "./lang";
import {renderToOutput} from "./display";
import T = Value.T;
import isPair = Value.isPair;
import Pair = Value.Pair;
import mkSyntax = Value.mkSyntax;
import isArray = Value.isArray;
import Syntax = Value.Syntax;
import isSym = Value.isSym;
import Sym = Value.Sym;
import Vector = Value.Vector;
import isChar = Value.isChar;
import Char = Value.Char;

class SyntaxNode {
    syntax: Value.Syntax
    value: string = ''
    name: string = ''
    parentname: string | null = null;
    simplename: string = '';
    index: number | null = null;
    children: SyntaxNode[] = [];

    constructor(syntax: Value.Syntax, parent: string | null = null, index: number | null = null) {
        this.syntax = syntax;
        this.parentname = parent;
        this.index = index;
        let v: T = this.syntax.value;

        switch (typeof v) {
            case 'boolean':
                this.value = "Boolean "+v;
                this.name = "a boolean "+v;
                this.simplename = ''+v;
                break;
            case 'number':
                this.value = "Numerical "+v;
                this.name = "the number "+v;
                this.simplename = ''+v;
                break;
            case 'string':
                this.value = '"'+v+'"';
                this.value = 'the string "'+v+'"';
                this.simplename = '"'+v+'"';
                break;
            case 'undefined':
                this.value = "Undefined";
                this.name = 'an undefined value';
                this.simplename = 'undefined';
                break;
            case 'function':
                this.value = 'Function';
                this.name = 'a function';
                this.simplename = 'a function';
                break;
            case 'object':
                if (isPair(v)) {
                    this.simplename = 'an s-expression';
                    this.children.push(new SyntaxNode(mkSyntax(((v as Pair).fst as Syntax).range, ((v as Pair).fst as Syntax).value)));
                    let tail: T = (v as Pair).snd;

                    if (isPair(this.children[0].syntax.value)) {
                        while (isPair(tail)) {
                            this.children.push(new SyntaxNode(mkSyntax(((tail as Pair).fst as Syntax).range, ((tail as Pair).fst as Syntax).value)));
                            tail = (tail as Pair).snd;
                        }
                    } else {
                        let i: number = 1;
                        while (isPair(tail)) {
                            this.children.push(new SyntaxNode(mkSyntax(((tail as Pair).fst as Syntax).range, ((tail as Pair).fst as Syntax).value), this.children[0].simplename, i));
                            i += 1;
                            tail = (tail as Pair).snd;
                        }
                    }

                    this.value = "S-expression";
                    //this.name = "the s-expression at "+this.syntax.range;
                    if (this.parentname != null) {
                        this.name = "the s-expression in argument "+this.index+" of "+this.parentname;
                    } else {
                        this.name = "the s-expression starting with " + this.children[0].name;
                    }
                } else if (isArray(v)) {
                    this.simplename = 'a square bracket array';

                    this.value = "Square bracket array";
                    this.name = "the square bracket array at "+this.syntax.range;
                    if (this.parentname != null) {
                        this.name = "the square bracket array in argument "+this.index+" of "+this.parentname;
                    }

                    let i: number = 0;
                    for (let c of (v as Vector)) {
                        this.children.push(new SyntaxNode(mkSyntax((c as Syntax).range, (c as Syntax).value),this.name,i));
                        i += 1;
                    }

                    if (this.parentname == null) {
                        this.name = "the square bracket array starting with " + this.children[0].name;
                    }
                } else if (isSym(v)) {
                    this.simplename = ''+(v as Sym).value;
                    this.value = "Symbol " + (v as Sym).value;
                    this.name = "the symbol "+(v as Sym).value;
                } else if (isChar(v)) {
                    this.simplename = ''+(v as Char).value;
                    this.value = "Character " + (v as Char).value;
                    this.value = "the character " + (v as Char).value;
                } else if (v === null) {
                    this.simplename = "null";
                    this.value = "null";
                    this.name = "null";
                } else {
                    this.simplename = "unknown object";
                    this.value = "Unknown Object";
                    this.name = "an unknown object";
                }
                break;
            default:
                this.simplename = "unknown value";
                this.value = "Unknown Value";
                this.name = "an unknown value";
        }
        //TODO: double check this is all of the possible syntax values (probably not)
        //this.value += " " + this.syntax.range;
    }

    toString(indent: string = ""): string {
        let ret: string = indent+this.value;

        for (let c of this.children) {
            ret += "\n" + c.toString(indent+"  ");
        }

        return ret;
    }
}

export class AST {
    syntax: Value.Syntax[]
    nodes: SyntaxNode[] = [];

    constructor(syntax: Value.Syntax[]) {
        this.syntax = syntax;

        for (let s of this.syntax) {
            this.nodes.push(new SyntaxNode(s));
        }
    }

    render(output: HTMLElement) {
        for (let n of this.nodes) {
            renderToOutput(output, "\n"+n.toString()+"\n");
        }
        renderToOutput(output, this.describe());
    }

    describe() : string {
        if (this.nodes.length === 0) {return "The source file is empty!";}

        let queue: SyntaxNode[] = [];

        let ret: string = ""
        for (let c of this.nodes) {
            ret += "The source file contains "+c.name + ". ";
            if (c.children.length !== 0) {
                queue.push(c);
            }

            while (queue.length > 0) {
                let parent = queue.shift();
                if (parent === undefined) {
                    break;
                }
                ret += parent.name + " contains: ";
                for (let c of parent.children) {
                    ret += c.simplename + ", ";
                    if (c.children.length !== 0) {
                        queue.push(c);
                    }
                }
                ret = ret.slice(0, -2) + ". ";
            }
        }

        return ret;
    }
}