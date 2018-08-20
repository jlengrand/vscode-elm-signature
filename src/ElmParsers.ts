import * as Parsimmon from 'parsimmon';

const P = Parsimmon;
const ws = P.whitespace;

const LowerCaseWordParser = P.regexp(/[a-z][\w]*/);
const UpperCaseWordParser = P.regexp(/[A-Z][\w]*/);
const ArrowParser = P.string("->");

const TypeDeclarationParser = P.alt(P.seq(UpperCaseWordParser, P.alt(P.seq(ws, LowerCaseWordParser).tie(), P.seq(ws, UpperCaseWordParser).tie())).tie(),
                                    UpperCaseWordParser);

// A simple signature parser
export const SimpleSignatureParser = P.seq(
                                        LowerCaseWordParser, 
                                        ws, 
                                        P.string(":"), 
                                        ws,
                                        // Order parsers based on consumption length
                                        P.alt( 
                                            P.seq(TypeDeclarationParser, ws, ArrowParser, ws).tie(),
                                            TypeDeclarationParser
                                        ).atLeast(1).tie()
                                        );

