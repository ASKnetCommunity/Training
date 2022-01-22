'''
Common functionality for ASKotec training meta-data conversion
from YAML into an RDF/Turtle.
'''

import re
import os
from packaging import version
import yaml
import rdflib
from rdflib.namespace import DC, DCTERMS, DOAP, FOAF, SKOS, OWL, RDF, RDFS, VOID, XMLNS, XSD
import wget
from typing import TYPE_CHECKING
if TYPE_CHECKING:
    from yaml2rdf import convert_file

SCHEMA = rdflib.Namespace('http://schema.org/')
SPDX = rdflib.Namespace('http://spdx.org/rdf/terms#')
ASK  = rdflib.Namespace('http://myontology.com/')
ASKA = rdflib.Namespace('http://myontology.com/authors/')
ASKT = rdflib.Namespace('http://myontology.com/trainings/')
ASKM = rdflib.Namespace('http://myontology.com/modules/')
ASKR = rdflib.Namespace('http://myontology.com/resources/')
ASKC = rdflib.Namespace('http://myontology.com/materials/')
ASKO = rdflib.Namespace('http://myontology.com/tools/')

KEY_URL_YAML = 'yaml-url'
KEY_URL_RDF = 'rdf-url'
KEY_FILE_RDF = 'rdf-file'

def version_compare(ver1, ver2):
    '''
    Compares two version strings.
    '''
    return version.parse(ver1) < version.parse(ver2)

def rdf_str(s):
    '''
    Converts a simple string into an RDF string (xsd:string).
    '''
    return rdflib.Literal(s, datatype=XSD.string)

def rdf_int(s):
    '''
    Converts a simple string into an RDF int (xsd:int).
    '''
    return rdflib.Literal(s, datatype=XSD.int)

def rdf_path(s):
    '''
    Converts a simple string into an RDF file path (xsd:string).
    '''
    return rdflib.Literal(s, datatype=XSD.string)

def rdf_url(s):
    '''
    Converts a simple string into an RDF URL (schema:URL).
    '''
    return rdflib.Literal(s, datatype=SCHEMA.URL)

def rdf_monetary_amount(s):
    '''
    Converts a simple string into an RDF monetary amount (schema:MonetaryAmount).
    '''
    return rdflib.Literal(s, datatype=SCHEMA.MonetaryAmount)

def rdf_duration(s):
    '''
    Converts a simple string into an RDF duration (schema:Duration).
    '''
    return rdflib.Literal(s, datatype=SCHEMA.Duration)

def str2id(s):
    '''
    Converts a random string into a valid RDF id (the last part of an IRI).
    '''
    return re.sub('[^a-zA-Z0-9_-]+', '_', s)

def conv_fail(msg):
    raise RuntimeError(msg)

def add(graph, subj, pred, yaml_cont, prop, type_conv, required=True):

    if prop in yaml_cont:
        graph.add(( subj, pred, type_conv(yaml_cont[prop]) ))
    elif required:
        conv_fail('Required property "%s" not present' % prop)

def conv_license(yaml_cont, g):

    subj = ASK[str2id(yaml_cont['name'])]
    # TODO Replace this with an external type, probably [http://spdx.org/rdf/terms#License](https://spdx.org/rdf/terms/#d4e2374)
    g.add(( subj, RDF.type, ASK.License ))
    g.add(( subj, RDFS.label, rdf_str(yaml_cont['name']) ))
    g.add(( subj, SPDX.licenseDeclared, SPDX[yaml_cont['name']] ))
    g.add(( subj, SCHEMA.file, rdf_str(yaml_cont['file']) ))
    return subj

def conv_licenses(yaml_cont, g, parent_subj):

    if 'licenses' in yaml_cont:
        for yaml_cont_part in yaml_cont['licenses']:
            g.add(( parent_subj, ASK.license, conv_license(yaml_cont_part, g) ))

def conv_author(yaml_cont, graph):

    subj = ASKA[str2id(yaml_cont['name'])]
    graph.add(( subj, RDF.type, SCHEMA.Person ))
    #graph.add(( subj, RDFS.label, rdf_str(yaml_cont['name']) ))
    graph.add(( subj, SCHEMA.name, rdf_str(yaml_cont['name']) ))
    graph.add(( subj, SCHEMA.email, rdf_str(yaml_cont['email']) ))
    if 'github-user' in yaml_cont:
        graph.add(( subj, SCHEMA.github, rdf_url(yaml_cont['github-user']) ))
    if 'telegram' in yaml_cont:
        graph.add(( subj, SCHEMA.telegram, rdf_str(yaml_cont['telegram']) ))
    #add(graph, subj, SCHEMA.telegram, yaml_cont, 'telegram', rdf_str, False)
    return subj

def conv_authors(yaml_cont, graph, parent_subj):

    if 'authors' in yaml_cont:
        for yaml_cont_part in yaml_cont['authors']:
            graph.add(( parent_subj, SCHEMA.author,
                conv_author(yaml_cont_part, graph) ))

def download(url, path):
    '''
    Downloads a URL pointing to a file into a local file,
    pointed to by path.
    '''
    print('downloading %s to %s ...' % (url, path))
    if os.path.exists(path):
        os.remove(path)
    wget.download(url, path, None)

def ensure_turtles(yaml_cont, g, type_str):
    '''
    Either downloads the module/resource RDF files directly,
    or downloads their YAML version,
    and converts them to RDF afterwards.
    '''

    elem_i = 0
    for elem in yaml_cont[type_str + 's']:
        if KEY_URL_YAML in elem:
            yml_url = elem[KEY_URL_YAML]
            yml_file = os.path.join(os.path.curdir,
                    '%s_%d.yml' % (type_str, elem_i))
            ttl_file = os.path.join(os.path.curdir,
                    '%s_%d.ttl' % (type_str, elem_i))
            pre_file = os.path.join(os.path.curdir,
                    '%s_%d.pref' % (type_str, elem_i))
            #download(yml_url, yml_file)
            convert_file(yml_file, ttl_file, pre_file)
            yaml_cont[KEY_FILE_RDF] = ttl_file
        elif KEY_URL_RDF in elem:
            ttl_url = elem[KEY_URL_RDF]
            ttl_file = os.path.join(os.path.curdir,
                    '%s_%d.ttl' % (type_str, elem_i))
            download(ttl_url, ttl_file)
            yaml_cont[KEY_FILE_RDF] = ttl_file
        else:
            conv_fail('%s needs either of %s or %s specified'
                    % (type_str, KEY_URL_YAML, KEY_URL_RDF))
        elem_i = elem_i + 1

def ensure_module_turtles(yaml_cont, g):
    '''
    Either downloads the module RDF files directly,
    or downloads their YAML version,
    and converts them to RDF afterwards.
    '''
    ensure_turtles(yaml_cont, g, 'module')

def ensure_resource_turtles(yaml_cont, g):
    '''
    Either downloads the resource RDF files directly,
    or downloads their YAML version,
    and converts them to RDF afterwards.
    '''
