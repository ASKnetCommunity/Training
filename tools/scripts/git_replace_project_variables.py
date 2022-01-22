#!/usr/bin/env python

from string import Template
import re
import os
import sys
import click
from git import Repo
import replace_vars
from datetime import date
from pathlib import Path

CONTEXT_SETTINGS = dict(help_option_names=['-h', '--help'])
DATE_FORMAT="%Y-%m-%d"

@click.group(context_settings=CONTEXT_SETTINGS)
@click.version_option()
def jekyll_replace_project_vars():
    pass

def git_remote_to_https_url(url):
    public_url = re.sub(r"^git@", "https://", url)
    public_url = public_url.replace(".com:", ".com/", 1)
    public_url = re.sub(r"\.git$", "", public_url)
    return public_url

@click.command(context_settings=CONTEXT_SETTINGS)
@click.argument("src", type=click.File("r"))
@click.argument("dst", type=click.File("w"))
@click.argument("additional_replacements", type=replace_vars.KEY_VALLUE_PAIR, nargs=-1)
@click.option('--src-file-path', '-p', type=click.Path(), envvar='PROJECT_SRC_FILE_PATH',
        default=None, help='The path to the source file, relative to the repo root')
@click.option('--repo-path', '-r', type=click.Path(), envvar='PROJECT_REPO_PATH',
        default='.', help='The path to the local git repo')
@click.option('--repo-url', '-u', type=click.STRING, envvar='PROJECT_REPO_URL',
        default=None, help='Public project repo URL')
@click.option('-o', '--organization', type=click.STRING, envvar='CI_REPOSITORY_OWNER',
        default=None, help='Project name (prefferably without spaces)')
@click.option('--branch', type=click.STRING,
        default=None, help='The currently checked-out branch')
@click.option('-n', '--name', type=click.STRING, envvar='CI_REPOSITORY_SLUG',
        default=None, help='Project name (prefferably without spaces)')
@click.option('--title', type=click.STRING, envvar='CI_REPOSITORY_NAME',
        default=None, help='Project name, human readable')
@click.option('--part-type', type=click.STRING,
        default=None, help='Project name, human readable')
@click.option('--vers', type=click.STRING, envvar='PROJECT_VERSION',
        default=None, help='Project version (prefferably without spaces)')
@click.option('--base-iri', type=click.STRING, envvar='BASE_IRI',
        default=None, help='The RDF base IRI used in the resource.ttl or module.ttl')
@click.option('--dry', is_flag=True, help='Whether to skip the actual replacing')
@click.option('--verbose', is_flag=True, help='Whether to output additional info to stderr')
def cli(src, dst, additional_replacements={}, src_file_path=None, repo_path='.',
        repo_url=None, organization=None, branch=None, name=None, title=None,
        part_type=None,  vers=None, base_iri=None, dry=False, verbose=False):
    # convert tuple to dict
    add_repls_dict = {}
    for key, value in additional_replacements:
        add_repls_dict[key] = value
    replace_vars_in_file(src, dst, add_repls_dict, src_file_path, repo_path,
            repo_url, name, organization, branch, part_type, title, vers, base_iri, dry, verbose)

def replace_vars_in_file(src, dst, additional_replacements={}, src_file_path=None, repo_path='.',
        repo_url=None, name=None, organization=None, branch=None, part_type=None,
        title=None, vers=None, base_iri=None, dry=False,
        verbose=False):
    repo = Repo(repo_path)
    vcs_branch = repo.head.reference
    vcs_remote_tracking_branch = vcs_branch.tracking_branch()
    vcs_remote = vcs_remote_tracking_branch.remote_name
    if repo_url is None:
        remote_urls = repo.remotes[vcs_remote].urls
        try:
            repo_url = next(remote_urls)
        except StopIteration as err:
            raise ValueError('No remote urls defined in repo "%s"' % repo_path) # from err
        if not repo_url.startswith('https://'):
            repo_url = git_remote_to_https_url(repo_url)
    slug = re.sub(r'.*[/:]([^/]+/[^/]+)/?$', '\g<1>', repo_url)
    if name is None:
        name = re.sub(r'.*/', '', slug)
    if organization is None:
        organization = re.sub(r'/.*', '', slug)
    if branch is None:
        branch = repo.active_branch
    if part_type is None:
        if os.path.exists(os.path.join(repo_path, 'resource.yml')):
            part_type = 'resource'
        elif os.path.exists(os.path.join(repo_path, 'module.yml')):
            part_type = 'module'
        elif os.path.exists(os.path.join(repo_path, 'training.yml')):
            part_type = 'training'
        else:
            print('ERROR: Unable to figure out part_type')
    email = "TODO@TODO.com"
    if base_iri is None:
        print('ERROR: base-IRI is not set!\nSet with --base-iri or BASE_IRI=')
        sys.exit(1)
    if title is None:
        title = name
    if vers is None:
        vers = repo.git.describe('--tags', '--dirty', '--broken', '--always')
    if src_file_path is None:
        src_file_path = src.name
    if src_file_path == '-':
        print('WARNING: "src_file_path" has the generic value "%s"'
                #% src_file_path, file=sys.stderr)
                % src_file_path)
    if part_type is None:
        print('ERROR: part_type has to be "resource", "module" or "training"')
        sys.exit(1)
    pre_filter=None
    post_filter=None
    additional_replacements.setdefault('PROJECT_REPO_URL', repo_url)
    additional_replacements.setdefault('PROJECT_NAME', name)
    additional_replacements.setdefault('PROJECT_VERSION', vers)
    additional_replacements.setdefault('SOURCE_FILE_PATH', src_file_path)
    additional_replacements.setdefault('gh_repo_name', name)
    additional_replacements.setdefault('gh_org_name', organization)
    additional_replacements.setdefault('branch', branch)
    additional_replacements.setdefault('title', title)
    additional_replacements.setdefault('type', part_type)
    additional_replacements.setdefault('email', email)
    additional_replacements.setdefault('base_iri', base_iri)
    replace_vars.replace_vars_by_lines_in_stream(
            src, dst, additional_replacements, dry, verbose,
            pre_filter=pre_filter, post_filter=post_filter)

if __name__ == '__main__':
    cli()
