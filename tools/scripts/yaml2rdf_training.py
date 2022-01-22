'''
Converts ASKotec training configurator meta-data
(from training.yaml) into an RDF/Turtle.
'''

import glob
import os
from rdflib.namespace import DC, DCTERMS, DOAP, FOAF, SKOS, OWL, RDF, RDFS, VOID, XMLNS, XSD
import wget
from yaml2rdf_shared import *
from yaml2rdf import convert_file

def convert_training_yaml_to_rdf(yaml_cont, g):
    '''
    Converts ASKotec training meta-data content
    into an RDF/Turtle string.
    '''

    supported_version = "1.0"
    if version_compare(yaml_cont['version'], supported_version) < 0:
        raise 'The content version is not supported by this converter. Please get a newer version!'

    y = yaml_cont['training']
    pre_path = 'training'

    m_s = ASKT[str2id(y['name'])]

    ensure_module_turtles(y, g)
    for mod_ttl in glob.glob('module_*.ttl'):
        g.parse(mod_ttl, format='ttl')
    for mod_s,_,_ in g.triples((None, RDF['type'], ASK['Module'])):
        g.add(( m_s, ASK.module, mod_s ))

    g.add(( m_s, RDF.type, ASK.Training ))
    g.add(( m_s, RDFS.label, rdf_str(y['name']) ))
