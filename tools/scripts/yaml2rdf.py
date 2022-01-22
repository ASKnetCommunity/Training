#!/usr/bin/env python
'''
Converts an ASKotec training module resource meta-data file
(resource.yaml) into an RDF/Turtle file.
'''

import re
import os
import glob
import yaml
import rdflib
from rdflib.namespace import DC, DCTERMS, DOAP, FOAF, SKOS, OWL, RDF, RDFS, VOID, XMLNS, XSD
import click
import yaml2rdf_training
import yaml2rdf_module
import yaml2rdf_resource
from yaml2rdf_shared import *

CONTEXT_SETTINGS = dict(help_option_names=['-h', '--help'])

@click.group(context_settings=CONTEXT_SETTINGS)
@click.version_option()
def version_token():
    pass

def create_graph():
    '''
    TODO Converts ASKotec training module resource meta-data content
    into an RDF/Turtle string.
    '''

    #rdflib.URIRef("http://example.com/person/nick"),
    #for part in yaml:
    #    print(part)

    g = rdflib.Graph()

    g.bind("rdf", RDF)
    g.bind("rdfs", RDFS)
    g.bind("schema", SCHEMA)
    g.bind("spdx", SPDX)
    g.bind("foaf", FOAF)
    g.bind("xsd",  XSD)
    g.bind("ask",  ASK)
    g.bind("aska", ASKA)
    g.bind("askt", ASKT)
    g.bind("askm", ASKM)
    g.bind("askr", ASKR)
    g.bind("askc", ASKC)
    g.bind("asko", ASKO)

    return g

def write_prefixes_file(g, pref_file):
    '''
    Writes the RDF prefixes of a graph
    into a Jekyll Prefixes.pref file.
    '''

    if not pref_file is None:
        pref_s = open(pref_file, 'w')
        for pre, iri in g.namespaces():
            pref_s.write('PREFIX %s: <%s>\n' % (pre, iri))
        pref_s.close()

def convert_yaml_to_rdf(yaml_cont, conv_func, pref_file=None):
    '''
    Converts ASKotec training module resource meta-data content
    into an RDF/Turtle string.
    '''

#    supported_version = "1.0"
#    if version_compare(yaml_cont['version'], supported_version) < 0:
#        raise 'The content version is not supported by this converter. Please get a newer version!'

    g = create_graph()

    write_prefixes_file(g, pref_file)

    conv_func(yaml_cont, g)

    return g.serialize(format="turtle")


def convert_file(yaml_file=None, rdf_file=None, pref_file='./Prefixes.pref'):
    '''
    Converts an Training, Module or Resource meta-data file
    (training|module|resource.yaml)
    into an RDF/Turtle file
    (training|module|resource.ttl).
    '''

    if yaml_file is None:
        for cur_yaml_file in glob.glob('*.yml'):
            match = re.search("^(training|module|resource).yml$", cur_yaml_file)
            if match:
                yaml_file = cur_yaml_file
                break
        if yaml_file is None:
            raise RuntimeError("The input YAML file is missing")
    if rdf_file is None:
        if yaml_file.endswith('.yml'):
            rdf_file = yaml_file[:-len('.yml')] + '.ttl'
        else:
            rdf_file = yaml_file + '.ttl'

    in_s = open(yaml_file, 'r')
    yaml_cont = yaml.load(in_s, Loader=yaml.SafeLoader)
    in_s.close()

    if 'training' in yaml_cont:
        conv_func = yaml2rdf_training.convert_training_yaml_to_rdf
    elif 'module' in yaml_cont:
        conv_func = yaml2rdf_module.convert_module_yaml_to_rdf
    elif 'resource' in yaml_cont:
        conv_func = yaml2rdf_resource.convert_resource_yaml_to_rdf
    else:
        conv_fail('YAML file "%s" is not a valid training, module or resource meta-data file'
                % yaml_file)

    rdf_cont = convert_yaml_to_rdf(yaml_cont, conv_func, pref_file)

    out_s = open(rdf_file, 'w')
    out_s.write(rdf_cont)
    out_s.close()

@click.command(context_settings=CONTEXT_SETTINGS)
@click.argument('yaml_file', type=click.Path(), envvar='YAML_FILE', default=None)
@click.argument('rdf_file', type=click.Path(), envvar='RDF_FILE', default=None)
@click.argument('pref_file', type=click.Path(), envvar='PREF_FILE', default='./Prefixes.pref')
@click.version_option("1.0")
def convert(yaml_file=None, rdf_file=None, pref_file='./Prefixes.pref'):
    '''
    Main CLI interface to yaml2rdf
    '''
    convert_file(yaml_file, rdf_file, pref_file)

if __name__ == '__main__':
    convert()

